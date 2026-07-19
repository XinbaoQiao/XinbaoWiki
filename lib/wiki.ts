import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { isChineseSlug, toChineseSlug, toEnglishSlug, wikiConceptType, wikiPageSummary, wikiPageTitle } from '@/lib/wiki-metadata';
import { getManifestSearchIndex, getManifestWikiPage, getPublicManifestSlugs } from '@/lib/wiki-manifest';

export { isChineseSlug, toChineseSlug, toEnglishSlug, wikiConceptType, wikiPageSummary, wikiPageTitle } from '@/lib/wiki-metadata';

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
  return getPublicManifestSlugs();
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

export function getWikiPageBySlug(slug: string, options: WikiPageOptions = {}): WikiPage | null {
  let decoded = '';
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    return null;
  }
  const resolved = resolveSlug(decoded);
  if (!resolved) return null;
  if (!options.includeHidden) return getManifestWikiPage(resolved);
  const fileName = `${resolved}.md`;
  const filePath = wikiFilePath(resolved);
  if (!filePath) return null;
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(raw);
  const data = parsed.data as WikiFrontmatter;
  const title = wikiPageTitle(data, resolved);
  const summary = wikiPageSummary(data);
  return { slug: resolved, title, summary, data, content: parsed.content.trim(), fileName };
}

export function getSearchIndex(): SearchIndexItem[] {
  return getManifestSearchIndex().map((item) => ({
    ...item,
    href: pathWithBasePath(item.href)
  }));
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
