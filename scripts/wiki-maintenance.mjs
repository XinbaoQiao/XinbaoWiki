import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import matter from 'gray-matter';

const root = process.cwd();
const wikiDir = path.join(root, 'wiki');
const pageIndexPath = path.join(wikiDir, 'pages.json');
const graphPath = path.join(wikiDir, 'graph.json');
const args = new Set(process.argv.slice(2));
const write = args.has('--write');
const check = args.has('--check') || !write;

const RESERVED_SLUGS = new Set(['index', 'index_zh', 'log', 'log_zh']);
const HOME_SLUGS = new Set(['Xinbao_Qiao', 'Qiao_Xinbao_zh', 'index', 'index_zh', 'log', 'log_zh']);

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function markdownFiles() {
  return fs.readdirSync(wikiDir)
    .filter((file) => file.endsWith('.md'))
    .sort((a, b) => a.localeCompare(b));
}

function normalizeSlug(slug) {
  return slug.trim().replace(/\s+/g, '_');
}

function isChineseSlug(slug) {
  return slug === 'Qiao_Xinbao_zh' || slug.endsWith('_zh');
}

function chineseCounterpart(slug) {
  if (slug === 'Xinbao_Qiao') return 'Qiao_Xinbao_zh';
  return `${slug}_zh`;
}

function englishCounterpart(slug) {
  if (slug === 'Qiao_Xinbao_zh') return 'Xinbao_Qiao';
  return slug.endsWith('_zh') ? slug.slice(0, -3) : slug;
}

function asString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function asStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim());
}

function pageTitle(slug, data) {
  return asString(data.name) || asString(data.title) || slug.replaceAll('_', ' ');
}

function pageSummary(data) {
  return asString(data.summary) || asString(data.description);
}

function conceptType(slug, data) {
  const explicit = asString(data.type);
  if (explicit) return explicit;
  const occupation = data.occupation;
  if (typeof occupation === 'string' && occupation.trim()) return occupation.trim();
  if (Array.isArray(occupation)) {
    const first = occupation.find((item) => typeof item === 'string' && item.trim());
    if (first) return first.trim();
  }
  if (Array.isArray(data.authors) || data.venue || data.publication_type) return 'publication';
  if (RESERVED_SLUGS.has(slug)) return slug.includes('log') ? 'update log' : 'index';
  return 'article';
}

function stripTargetSuffix(target) {
  return target.trim().replace(/^[./]+/, '').split('#')[0].split('?')[0].replace(/\.md$/, '');
}

function resolveSlug(target, slugSet) {
  const cleaned = stripTargetSuffix(target);
  if (!cleaned) return '';
  if (slugSet.has(cleaned)) return cleaned;
  const normalized = normalizeSlug(cleaned);
  if (slugSet.has(normalized)) return normalized;
  return normalized;
}

function resolveWikiTarget(sourcePage, target, slugSet) {
  const resolved = resolveSlug(target, slugSet);
  if (!resolved || !slugSet.has(resolved)) return resolved;
  if (sourcePage.language === 'zh' && !isChineseSlug(resolved)) {
    const localized = chineseCounterpart(resolved);
    if (slugSet.has(localized)) return localized;
  }
  if (sourcePage.language === 'en' && isChineseSlug(resolved)) {
    const localized = englishCounterpart(resolved);
    if (slugSet.has(localized)) return localized;
  }
  return resolved;
}

function publicAssetExists(href) {
  const clean = decodeURIComponent(href.split('#')[0].split('?')[0]);
  if (!clean.startsWith('/')) return true;
  if (clean.startsWith('/wiki/')) return true;
  return fs.existsSync(path.join(root, 'public', clean.slice(1)));
}

function wikiMarkdownTarget(href) {
  const clean = decodeURIComponent(href.split('#')[0].split('?')[0]);
  if (clean.startsWith('/wiki/')) {
    return clean.replace(/^\/wiki\//, '').replace(/\/$/, '');
  }
  if (clean.endsWith('.md')) return clean;
  return '';
}

function parsePage(file) {
  const slug = file.replace(/\.md$/, '');
  const filePath = path.join(wikiDir, file);
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(raw);
  const data = parsed.data || {};
  return {
    aliases: asStringArray(data.aliases),
    content: parsed.content.trim(),
    data,
    file,
    hidden: data.hidden === true,
    language: isChineseSlug(slug) ? 'zh' : 'en',
    slug,
    summary: pageSummary(data),
    tags: asStringArray(data.tags),
    title: pageTitle(slug, data),
    type: conceptType(slug, data)
  };
}

function collect() {
  const errors = [];
  const warnings = [];
  const files = markdownFiles();
  const pages = [];

  for (const file of files) {
    try {
      pages.push(parsePage(file));
    } catch (error) {
      errors.push(`${file}: frontmatter is not parseable (${error.message})`);
    }
  }

  const slugSet = new Set(pages.map((page) => page.slug));
  const nodeMap = new Map();
  const edges = [];

  for (const page of pages) {
    if (!page.title) errors.push(`${page.file}: missing display title`);
    if (!page.type) errors.push(`${page.file}: missing concept type`);
    if (!page.summary && !RESERVED_SLUGS.has(page.slug)) warnings.push(`${page.file}: missing summary/description`);
    if (!page.data.type && !page.data.occupation) warnings.push(`${page.file}: type is derived; add explicit type for stricter OKF compatibility`);

    const outgoing = new Set();
    for (const match of page.content.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)) {
      const target = resolveWikiTarget(page, match[1], slugSet);
      if (!target || !slugSet.has(target)) {
        errors.push(`${page.file}: missing WikiLink target [[${match[1].trim()}]]`);
        continue;
      }
      outgoing.add(target);
      edges.push({
        from: page.slug,
        label: match[2]?.trim() || '',
        relation: 'wikilink',
        to: target
      });
    }

    for (const match of page.content.matchAll(/!?\[[^\]]*]\(([^)]+)\)/g)) {
      const href = match[1].trim();
      if (/^(https?:|mailto:|#)/.test(href)) continue;
      const target = wikiMarkdownTarget(href);
      if (target) {
        const slug = resolveSlug(target, slugSet);
        if (!slugSet.has(slug)) errors.push(`${page.file}: missing markdown wiki target (${href})`);
        else {
          outgoing.add(slug);
          edges.push({ from: page.slug, label: '', relation: 'markdown-link', to: slug });
        }
      } else if (!publicAssetExists(href)) {
        errors.push(`${page.file}: missing public asset (${href})`);
      }
    }

    nodeMap.set(page.slug, {
      aliases: page.aliases,
      file: page.file,
      hidden: page.hidden,
      language: page.language,
      outgoing: [...outgoing].sort((a, b) => a.localeCompare(b)),
      slug: page.slug,
      summary: page.summary,
      tags: page.tags,
      title: page.title,
      type: page.type
    });
  }

  const incoming = new Map();
  for (const edge of edges) {
    if (!incoming.has(edge.to)) incoming.set(edge.to, new Set());
    incoming.get(edge.to).add(edge.from);
  }

  const nodes = [...nodeMap.values()]
    .map((node) => ({
      ...node,
      backlinks: [...(incoming.get(node.slug) || [])].sort((a, b) => a.localeCompare(b))
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug));

  for (const node of nodes) {
    if (node.hidden || HOME_SLUGS.has(node.slug)) continue;
    if (node.backlinks.length === 0) warnings.push(`${node.file}: no backlinks from other wiki pages`);
    if (node.outgoing.length === 0) warnings.push(`${node.file}: no outgoing wiki links`);
  }

  for (const node of nodes) {
    if (node.hidden || RESERVED_SLUGS.has(node.slug)) continue;
    if (node.language === 'en') {
      const expected = chineseCounterpart(node.slug);
      if (!slugSet.has(expected)) warnings.push(`${node.file}: missing Chinese counterpart ${expected}.md`);
    } else {
      const expected = englishCounterpart(node.slug);
      if (!slugSet.has(expected)) warnings.push(`${node.file}: missing English counterpart ${expected}.md`);
    }
  }

  const duplicateTitles = new Map();
  for (const node of nodes.filter((node) => !node.hidden)) {
    const key = `${node.language}:${node.title.toLocaleLowerCase()}`;
    duplicateTitles.set(key, [...(duplicateTitles.get(key) || []), node.file]);
  }
  for (const [key, filesForTitle] of duplicateTitles.entries()) {
    if (filesForTitle.length > 1) warnings.push(`duplicate visible title ${key}: ${filesForTitle.join(', ')}`);
  }

  const publicPages = nodes
    .filter((node) => !node.hidden)
    .map((node) => ({
      slug: node.slug,
      title: node.title,
      summary: node.summary,
      language: node.language,
      type: node.type,
      tags: node.tags
    }));

  const typeCounts = {};
  const languageCounts = {};
  for (const node of nodes) {
    typeCounts[node.type] = (typeCounts[node.type] || 0) + 1;
    languageCounts[node.language] = (languageCounts[node.language] || 0) + 1;
  }

  const graph = {
    schemaVersion: 1,
    nodes,
    edges: edges.sort((a, b) => `${a.from}:${a.to}:${a.relation}`.localeCompare(`${b.from}:${b.to}:${b.relation}`)),
    stats: {
      hiddenPages: nodes.filter((node) => node.hidden).length,
      languages: Object.fromEntries(Object.entries(languageCounts).sort(([a], [b]) => a.localeCompare(b))),
      pages: nodes.length,
      publicPages: publicPages.length,
      relations: edges.length,
      types: Object.fromEntries(Object.entries(typeCounts).sort(([a], [b]) => a.localeCompare(b))),
      warnings: warnings.length
    },
    warnings: warnings.sort((a, b) => a.localeCompare(b))
  };

  const index = {
    schemaVersion: 2,
    pages: publicPages.sort((a, b) => {
      if (a.language !== b.language) return a.language.localeCompare(b.language);
      return a.title.localeCompare(b.title) || a.slug.localeCompare(b.slug);
    })
  };

  return { errors, graph, index, warnings };
}

function assertFresh(filePath, expected) {
  if (!fs.existsSync(filePath)) {
    fail(`${path.relative(root, filePath)} is missing; run npm run maintain:wiki`);
    return;
  }
  const actual = fs.readFileSync(filePath, 'utf8');
  if (actual !== expected) fail(`${path.relative(root, filePath)} is stale; run npm run maintain:wiki`);
}

const result = collect();
const nextIndex = stableJson(result.index);
const nextGraph = stableJson(result.graph);

if (write) {
  fs.writeFileSync(pageIndexPath, nextIndex);
  fs.writeFileSync(graphPath, nextGraph);
}

if (check) {
  assertFresh(pageIndexPath, nextIndex);
  assertFresh(graphPath, nextGraph);
}

for (const error of result.errors) fail(error);

const summary = {
  errors: result.errors.length,
  graph: result.graph.stats,
  mode: write ? 'write' : 'check',
  warnings: result.warnings.length
};

if (result.warnings.length) {
  console.warn(`Wiki maintenance warnings: ${result.warnings.length}`);
  for (const warning of result.warnings.slice(0, 20)) console.warn(`- ${warning}`);
  if (result.warnings.length > 20) console.warn(`- ... ${result.warnings.length - 20} more warnings`);
}

console.log(JSON.stringify(summary, null, 2));
