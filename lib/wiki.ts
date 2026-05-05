import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export type LinkItem = { label: string; url: string; detail?: string; title?: string };

export type WikiFrontmatter = {
  name?: string;
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
  image_caption?: string;
  type?: string;
  authors?: string[];
  venue?: string;
  location?: string;
  year?: string | number;
  status?: string;
  publication_type?: string;
  categories?: string[];
  links?: LinkItem[];
  summary?: string;
  aliases?: string[];
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

const WIKI_DIR = path.join(process.cwd(), 'wiki');

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

export function getAllWikiSlugs() {
  return files().map((file) => file.replace(/\.md$/, ''));
}

function normalizeSlug(slug: string) {
  return slug.trim().replace(/\s+/g, '_');
}

function resolveSlug(target: string) {
  const trimmed = target.trim();
  const exact = path.join(WIKI_DIR, `${trimmed}.md`);
  if (fs.existsSync(exact)) return trimmed;
  const normalized = normalizeSlug(trimmed);
  if (fs.existsSync(path.join(WIKI_DIR, `${normalized}.md`))) return normalized;
  return normalized;
}

function pageExists(slug: string) {
  return fs.existsSync(path.join(WIKI_DIR, `${resolveSlug(slug)}.md`));
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

export function getWikiPageBySlug(slug: string): WikiPage | null {
  const decoded = decodeURIComponent(slug);
  const resolved = resolveSlug(decoded);
  const fileName = `${resolved}.md`;
  const filePath = path.join(WIKI_DIR, fileName);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(raw);
  const data = parsed.data as WikiFrontmatter;
  const title = typeof data.name === 'string' && data.name.trim() ? data.name : resolved.replaceAll('_', ' ');
  const summary = typeof data.summary === 'string' ? data.summary : '';
  return { slug: resolved, title, summary, data, content: parsed.content.trim(), fileName };
}

function hrefFor(target: string, language: 'en' | 'zh' = 'en') {
  const slug = resolveSlug(target);
  const localizedSlug = language === 'zh' ? toChineseSlug(slug) : toEnglishSlug(slug);
  const hrefSlug = pageExists(localizedSlug) ? localizedSlug : slug;
  const encoded = encodeURIComponent(hrefSlug);
  return pageExists(hrefSlug) ? `/wiki/${encoded}/` : `/wiki/${encoded}/?missing=1`;
}

export function preprocessWikiLinks(markdown: string, options: { language?: 'en' | 'zh' } = {}) {
  const language = options.language || 'en';
  return markdown.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, label) => {
    const text = label || String(target).replaceAll('_', ' ');
    return `[${text}](${hrefFor(target, language)})`;
  });
}
