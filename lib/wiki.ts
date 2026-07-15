import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export type LinkItem = { label: string; url: string; detail?: string; title?: string };

export type WikiImageItem = {
  src: string;
  alt: string;
  caption?: string;
  fit?: 'cover' | 'contain';
  position?: string;
};

export type WikiFrontmatter = {
  name?: string;
  title?: string;
  description?: string;
  native_name?: string;
  born?: string | null;
  birth_place?: string | null;
  residence?: string | null;
  occupation?: string | string[];
  affiliation?: unknown[];
  education?: unknown[];
  person?: unknown;
  program?: unknown;
  school?: unknown;
  department?: unknown;
  dates?: unknown;
  place?: unknown;
  focus?: unknown;
  avatar?: string;
  image?: string;
  image_alt?: string;
  image_caption?: string;
  image_gallery?: WikiImageItem[];
  type?: string;
  authors?: string[];
  venue?: string;
  location?: string;
  year?: string | number;
  status?: string;
  publication_type?: string;
  categories?: string[];
  tags?: string[];
  resource?: string;
  timestamp?: string;
  okf_version?: string;
  links?: LinkItem[];
  summary?: string;
  aliases?: string[];
  hidden?: boolean;
  [key: string]: unknown;
};

export type WikiPage = {
  slug: string;
  title: string;
  summary: string;
  data: WikiFrontmatter;
  content: string;
  fileName: string;
};

export type SearchIndexItem = {
  slug: string;
  href: string;
  title: string;
  summary: string;
  language: 'en' | 'zh';
  type: string;
  aliases: string[];
  tags: string[];
  text: string;
};

const WIKI_DIR = path.join(process.cwd(), 'wiki');
const WIKI_ROOT = path.resolve(WIKI_DIR);
const WIKI_SLUG_PATTERN = /^[A-Za-z0-9_\-\u4e00-\u9fff]+$/u;
type WikiSlugOptions = { includeHidden?: boolean };
type WikiPageOptions = { includeHidden?: boolean };

export function getBasePath() {
  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] || '';
  const gha = process.env.GITHUB_ACTIONS === 'true';
  const userRepo = repo.endsWith('.github.io');
  const inferred = gha && repo && !userRepo ? `/${repo}` : '';
  return (process.env.NEXT_PUBLIC_BASE_PATH ?? inferred).replace(/\/$/, '');
}

export function pathWithBasePath(pathname: string) {
  const base = getBasePath();
  if (!pathname.startsWith('/') || pathname.startsWith('//')) return pathname;
  if (!base || pathname === base || pathname.startsWith(`${base}/`)) return pathname;
  return `${base}${pathname}`;
}

function files() {
  return fs.readdirSync(WIKI_DIR).filter((file) => file.endsWith('.md')).sort();
}

function isHiddenWikiFile(fileName: string) {
  const filePath = path.join(WIKI_DIR, fileName);
  const raw = fs.readFileSync(filePath, 'utf8');
  return (matter(raw).data as WikiFrontmatter).hidden === true;
}

export function getAllWikiSlugs(options: WikiSlugOptions = {}) {
  const allSlugs = files().map((file) => file.replace(/\.md$/, ''));
  if (options.includeHidden) return allSlugs;
  return allSlugs.filter((slug) => !isHiddenWikiFile(`${slug}.md`));
}

export function getPublicWikiSlugs() {
  return getAllWikiSlugs();
}

function normalizeSlug(slug: string) {
  return slug.trim().replace(/\s+/g, '_').replace(/\.md$/i, '');
}

export function isSafeWikiSlug(slug: string) {
  return WIKI_SLUG_PATTERN.test(slug);
}

function wikiFilePath(slug: string) {
  if (!isSafeWikiSlug(slug)) return null;
  const filePath = path.resolve(WIKI_DIR, `${slug}.md`);
  if (filePath !== path.join(WIKI_ROOT, `${slug}.md`)) return null;
  return filePath;
}

function resolveSlug(target: string) {
  const trimmed = normalizeSlug(target);
  if (!trimmed || !isSafeWikiSlug(trimmed)) return '';
  const exact = wikiFilePath(trimmed);
  if (exact && fs.existsSync(exact)) return trimmed;
  const normalized = normalizeSlug(trimmed);
  if (!normalized || !isSafeWikiSlug(normalized)) return '';
  const normalizedPath = wikiFilePath(normalized);
  if (normalizedPath && fs.existsSync(normalizedPath)) return normalized;
  return normalized;
}

function pageExists(slug: string) {
  const resolved = resolveSlug(slug);
  const filePath = resolved ? wikiFilePath(resolved) : null;
  return Boolean(filePath && fs.existsSync(filePath));
}

export function isChineseSlug(slug: string) {
  return slug === 'Qiao_Xinbao_zh' || slug.endsWith('_zh');
}

export function toChineseSlug(slug: string) {
  if (slug === 'Xinbao_Qiao') return 'Qiao_Xinbao_zh';
  if (isChineseSlug(slug)) return slug;
  return `${slug}_zh`;
}

export function toEnglishSlug(slug: string) {
  if (slug === 'Qiao_Xinbao_zh') return 'Xinbao_Qiao';
  return slug.endsWith('_zh') ? slug.slice(0, -3) : slug;
}

export function wikiPageTitle(data: WikiFrontmatter, slug: string) {
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  return name || title || slug.replaceAll('_', ' ');
}

export function wikiPageSummary(data: WikiFrontmatter) {
  const summary = typeof data.summary === 'string' ? data.summary.trim() : '';
  const description = typeof data.description === 'string' ? data.description.trim() : '';
  return summary || description;
}

export function wikiConceptType(data: WikiFrontmatter, slug: string) {
  if (typeof data.type === 'string' && data.type.trim()) return data.type.trim();
  if (typeof data.occupation === 'string' && data.occupation.trim()) return data.occupation.trim();
  if (Array.isArray(data.occupation)) {
    const first = data.occupation.find((item) => typeof item === 'string' && item.trim());
    if (typeof first === 'string') return first.trim();
  }
  if (Array.isArray(data.authors) || data.venue || data.publication_type) return 'publication';
  if (slug === 'index' || slug === 'index_zh') return 'index';
  if (slug === 'log' || slug === 'log_zh') return 'update log';
  return 'article';
}

export function getWikiPageBySlug(slug: string, options: WikiPageOptions = {}): WikiPage | null {
  let decoded = '';
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    return null;
  }
  const resolved = resolveSlug(decoded);
  if (!resolved) return null;
  const fileName = `${resolved}.md`;
  const filePath = wikiFilePath(resolved);
  if (!filePath) return null;
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(raw);
  const data = parsed.data as WikiFrontmatter;
  if (data.hidden === true && !options.includeHidden) return null;
  const title = wikiPageTitle(data, resolved);
  const summary = wikiPageSummary(data);
  return { slug: resolved, title, summary, data, content: parsed.content.trim(), fileName };
}

function asSearchStrings(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return [String(value)];
  if (Array.isArray(value)) return value.flatMap(asSearchStrings);
  if (typeof value === 'object') return Object.values(value).flatMap(asSearchStrings);
  return [];
}

function plainText(markdown: string) {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, label) => String(label || target).replaceAll('_', ' '))
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, ' ')
    .replace(/[#>*_|~`$\\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getSearchIndex(): SearchIndexItem[] {
  return getAllWikiSlugs()
    .map((slug) => getWikiPageBySlug(slug))
    .filter((page): page is WikiPage => Boolean(page))
    .filter((page) => page.data.hidden !== true)
    .map((page) => {
      const aliases = Array.isArray(page.data.aliases) ? page.data.aliases.filter((alias): alias is string => typeof alias === 'string') : [];
      const tags = Array.isArray(page.data.tags) ? page.data.tags.filter((tag): tag is string => typeof tag === 'string') : [];
      const frontmatterText = asSearchStrings({
        occupation: page.data.occupation,
        affiliation: page.data.affiliation,
        education: page.data.education,
        type: wikiConceptType(page.data, page.slug),
        tags,
        authors: page.data.authors,
        venue: page.data.venue,
        location: page.data.location,
        year: page.data.year,
        status: page.data.status,
        publication_type: page.data.publication_type
      }).join(' ');
      const text = [
        page.title,
        page.summary,
        aliases.join(' '),
        frontmatterText,
        plainText(page.content)
      ].join(' ');
      return {
        slug: page.slug,
        href: pathWithBasePath(`/wiki/${encodeURIComponent(page.slug)}/`),
        title: page.title,
        summary: page.summary,
        language: isChineseSlug(page.slug) ? 'zh' : 'en',
        type: wikiConceptType(page.data, page.slug),
        aliases,
        tags,
        text: text.slice(0, 2400)
      };
    });
}

function hasExplicitEnglishLabel(label: string) {
  return /English|英文/i.test(label);
}

function shouldPreserveResolvedTarget(target: string, resolved: string, language: 'en' | 'zh', label: string) {
  const normalizedTarget = normalizeSlug(target);
  if (language === 'en' && isChineseSlug(resolved) && isChineseSlug(normalizedTarget)) return true;
  if (language === 'zh' && !isChineseSlug(resolved) && hasExplicitEnglishLabel(label)) return true;
  return false;
}

function hrefFor(target: string, language: 'en' | 'zh' = 'en', label = '') {
  const slug = resolveSlug(target);
  if (!slug) return `/wiki/${encodeURIComponent('Invalid_Page')}/?missing=1`;
  const localizedSlug = shouldPreserveResolvedTarget(target, slug, language, label)
    ? slug
    : language === 'zh' ? toChineseSlug(slug) : toEnglishSlug(slug);
  const hrefSlug = pageExists(localizedSlug) ? localizedSlug : slug;
  const encoded = encodeURIComponent(hrefSlug);
  return pageExists(hrefSlug) ? `/wiki/${encoded}/` : `/wiki/${encoded}/?missing=1`;
}

export function preprocessWikiLinks(markdown: string, options: { language?: 'en' | 'zh' } = {}) {
  const language = options.language || 'en';
  return markdown.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, label) => {
    const text = label || String(target).replaceAll('_', ' ');
    return `[${text}](${hrefFor(target, language, label || '')})`;
  });
}
