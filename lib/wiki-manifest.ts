import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { isChineseSlug, wikiConceptType, wikiPageSummary, wikiPageTitle } from '@/lib/wiki-metadata';
import type { SearchIndexItem, WikiFrontmatter, WikiPage } from '@/lib/wiki';

export type WikiLanguage = 'en' | 'zh';

export type WikiManifestEntry = {
  slug: string;
  href: string;
  title: string;
  summary: string;
  language: WikiLanguage;
  type: string;
  tags: string[];
  aliases: string[];
  timestamp?: string;
  updatedAt?: string;
  fileName: string;
};

type WikiManifestRecord = WikiManifestEntry & {
  content: string;
  data: WikiFrontmatter;
};

type WikiManifestCache = {
  records: WikiManifestRecord[];
  entries: WikiManifestEntry[];
  entryMap: Map<string, WikiManifestEntry>;
  pageMap: Map<string, WikiPage>;
};

const WIKI_DIR = path.join(process.cwd(), 'wiki');
let manifestCache: WikiManifestCache | null = null;

function files() {
  return fs.readdirSync(WIKI_DIR).filter((file) => file.endsWith('.md')).sort();
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function dateString(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || Number.isNaN(Date.parse(trimmed))) return undefined;
  return trimmed;
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

function buildManifest() {
  const records = files().flatMap((fileName): WikiManifestRecord[] => {
    const slug = fileName.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(WIKI_DIR, fileName), 'utf8');
    const parsed = matter(raw);
    const data = parsed.data as WikiFrontmatter;
    if (data.hidden === true) return [];
    const timestamp = dateString(data.timestamp);
    const updatedAt = dateString(data.modified) || dateString(data.updatedAt) || dateString(data.updated_at) || dateString(data.reviewed_at);
    const type = wikiConceptType(data, slug);
    return [{
      slug,
      href: `/wiki/${encodeURIComponent(slug)}/`,
      title: wikiPageTitle(data, slug),
      summary: wikiPageSummary(data),
      language: isChineseSlug(slug) ? 'zh' : 'en',
      type,
      tags: stringList(data.tags),
      aliases: stringList(data.aliases),
      timestamp,
      updatedAt,
      fileName,
      content: parsed.content.trim(),
      data
    }];
  });
  const entries = records.map(({ content: _content, data: _data, ...entry }) => entry);
  return {
    records,
    entries,
    entryMap: new Map(entries.map((entry) => [entry.slug, entry])),
    pageMap: new Map(records.map((record) => [record.slug, {
      slug: record.slug,
      title: record.title,
      summary: record.summary,
      data: record.data,
      content: record.content,
      fileName: record.fileName
    }]))
  } satisfies WikiManifestCache;
}

function cache() {
  manifestCache ??= buildManifest();
  return manifestCache;
}

function records() {
  return cache().records;
}

export function getWikiManifest(): WikiManifestEntry[] {
  return cache().entries;
}

export function getWikiManifestEntry(slug: string) {
  return cache().entryMap.get(slug) ?? null;
}

export function getManifestWikiPage(slug: string): WikiPage | null {
  return cache().pageMap.get(slug) ?? null;
}

export function getPublicManifestSlugs() {
  return getWikiManifest().map((entry) => entry.slug);
}

export function getManifestSearchIndex(): SearchIndexItem[] {
  return records().map((page) => {
    const frontmatterText = asSearchStrings({
      occupation: page.data.occupation,
      affiliation: page.data.affiliation,
      education: page.data.education,
      type: page.type,
      tags: page.tags,
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
      page.aliases.join(' '),
      frontmatterText,
      plainText(page.content)
    ].join(' ');
    return {
      slug: page.slug,
      href: page.href,
      title: page.title,
      summary: page.summary,
      language: page.language,
      type: page.type,
      aliases: page.aliases,
      tags: page.tags,
      text: text.slice(0, 2400)
    };
  });
}

export function getWikiFeedEntries(limit = 20) {
  return [...getWikiManifest()]
    .filter((entry) => entry.updatedAt || entry.timestamp)
    .sort((a, b) => Date.parse(b.updatedAt ?? b.timestamp ?? '') - Date.parse(a.updatedAt ?? a.timestamp ?? ''))
    .slice(0, limit);
}
