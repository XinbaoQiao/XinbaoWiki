import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import matter from 'gray-matter';

const root = process.cwd();
const wikiDir = path.join(root, 'wiki');
const publicDir = path.join(root, 'public');
const okfDir = path.join(publicDir, 'okf');
const okfConceptDir = path.join(okfDir, 'concepts');
const pageIndexPath = path.join(wikiDir, 'pages.json');
const graphPath = path.join(wikiDir, 'graph.json');
const schemaPath = path.join(wikiDir, 'maintenance-schema.json');
const okfManifestPath = path.join(okfDir, 'manifest.json');
const okfPageIndexPath = path.join(okfDir, 'pages.json');
const okfGraphPath = path.join(okfDir, 'graph.json');
const okfSchemaPath = path.join(okfDir, 'schema.json');
const okfIndexPath = path.join(okfDir, 'index.md');
const okfLogPath = path.join(okfDir, 'log.md');

const args = new Set(process.argv.slice(2));
const standardize = args.has('--standardize');
const write = args.has('--write') || standardize;
const check = args.has('--check') || !write;

const OKF_VERSION = '0.1';
const SOURCE_SCHEMA_VERSION = 4;
const GRAPH_SCHEMA_VERSION = 3;
const PAGE_INDEX_SCHEMA_VERSION = 3;
const OKF_EXPORT_SCHEMA_VERSION = 2;
const FALLBACK_TIMESTAMP = '1970-01-01T00:00:00Z';

const RESERVED_SLUGS = new Set(['index', 'index_zh', 'log', 'log_zh']);
const HOME_SLUGS = new Set(['Xinbao_Qiao', 'Qiao_Xinbao_zh', 'index', 'index_zh', 'log', 'log_zh']);
const BODY_RELATIONS = new Set(['wikilink', 'markdown-link']);
const STRUCTURED_RELATIONS = new Set(['related', 'uses', 'depends-on', 'supersedes', 'contradicts', 'derived-from', 'cites']);
const SUPPORTED_RELATIONS = new Set([...BODY_RELATIONS, ...STRUCTURED_RELATIONS]);

const FIELD_ORDER = [
  'type',
  'title',
  'description',
  'tags',
  'timestamp',
  'name',
  'language',
  'summary',
  'aliases',
  'hidden',
  'occupation',
  'native_name',
  'born',
  'birth_place',
  'residence',
  'affiliation',
  'education',
  'person',
  'program',
  'school',
  'department',
  'dates',
  'place',
  'focus',
  'avatar',
  'image',
  'image_caption',
  'authors',
  'venue',
  'location',
  'year',
  'status',
  'publication_type',
  'categories',
  'resource',
  'relations',
  'links'
];

const TYPE_TAGS = new Map([
  ['Academic advisor', ['person', 'advisor']],
  ['CV summary', ['cv', 'profile']],
  ['CV 摘要', ['cv', 'profile', 'zh']],
  ['Education timeline', ['education', 'profile']],
  ['Maintenance log', ['maintenance', 'log']],
  ['Model family', ['research', 'model']],
  ['PhD student', ['person', 'biography']],
  ['Project overview', ['project', 'overview']],
  ['Public research university', ['institution', 'education']],
  ['publication', ['publication']],
  ['Publication list', ['publication', 'index']],
  ['Research concept', ['research', 'concept']],
  ['Research experience', ['experience', 'profile']],
  ['Research institute', ['institution', 'research']],
  ['Research overview', ['research', 'overview']],
  ['Research topic', ['research', 'topic']],
  ['Resource inventory', ['resource', 'archive']],
  ['style guide', ['style', 'guide']],
  ['Technical skills', ['skills', 'profile']],
  ['Wiki index', ['index', 'navigation']],
  ['Wiki 索引', ['index', 'navigation', 'zh']],
  ['公立研究型大学', ['institution', 'education', 'zh']],
  ['博士生', ['person', 'biography', 'zh']],
  ['技术技能', ['skills', 'profile', 'zh']],
  ['教育时间线', ['education', 'profile', 'zh']],
  ['模型族', ['research', 'model', 'zh']],
  ['研究专题', ['research', 'topic', 'zh']],
  ['研究概念', ['research', 'concept', 'zh']],
  ['研究概览', ['research', 'overview', 'zh']],
  ['研究经历', ['experience', 'profile', 'zh']],
  ['研究院', ['institution', 'research', 'zh']],
  ['维护日志', ['maintenance', 'log', 'zh']],
  ['论文列表', ['publication', 'index', 'zh']],
  ['资源记录', ['resource', 'archive', 'zh']],
  ['项目概览', ['project', 'overview', 'zh']]
]);

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function stableMarkdown(value) {
  return `${value.trim()}\n`;
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

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function uniqueStrings(values) {
  return [...new Set(values.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim()))];
}

function normalizeRelationType(value) {
  return asString(value).toLowerCase().replace(/[_\s]+/g, '-');
}

function pageTitle(slug, data) {
  return asString(data.title) || asString(data.name) || slug.replaceAll('_', ' ');
}

function pageSummary(data) {
  return asString(data.description) || asString(data.summary);
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
  if (RESERVED_SLUGS.has(slug)) return slug.includes('log') ? (isChineseSlug(slug) ? '维护日志' : 'Maintenance log') : (isChineseSlug(slug) ? 'Wiki 索引' : 'Wiki index');
  return isChineseSlug(slug) ? '研究概念' : 'Research concept';
}

function kebab(value) {
  return value
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function defaultTags(slug, data) {
  const tags = [
    isChineseSlug(slug) ? 'zh' : 'en',
    ...asStringArray(data.categories),
    ...TYPE_TAGS.get(conceptType(slug, data)) || [],
    kebab(conceptType(slug, data))
  ];

  if (Array.isArray(data.authors) || data.venue || data.publication_type) tags.push('paper');
  if (asString(data.status)) tags.push(kebab(data.status));
  if (asString(data.venue)) tags.push(kebab(data.venue));
  if (slug.includes('Machine_Unlearning') || slug.includes('Certified_Data_Removal')) tags.push('machine-unlearning');
  if (slug.includes('Synthetic_Data') || slug.includes('Model_Collapse')) tags.push('synthetic-data');
  if (slug.includes('Wasserstein')) tags.push('wasserstein');
  if (slug.includes('AI_and_Networks')) tags.push('ai-and-networks');
  if (slug.includes('LLM') || slug.includes('Interpretability')) tags.push('llm');
  if (data.hidden === true) tags.push('private');

  return uniqueStrings(tags.filter(Boolean));
}

function firstBodySentence(markdown) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, label) => String(label || target).replaceAll('_', ' '))
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/\[\^[^\]]+]:[\s\S]*$/g, ' ')
    .replace(/[#>*_|~`$\\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  const sentence = text.match(/^.{1,220}?(?:[.!?。！？]|$)/)?.[0] || text.slice(0, 220);
  return sentence.trim();
}

function gitTimestamp(file) {
  try {
    const timestamp = execFileSync('git', ['log', '-1', '--format=%cI', '--', path.join('wiki', file)], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    return timestamp || FALLBACK_TIMESTAMP;
  } catch {
    return FALLBACK_TIMESTAMP;
  }
}

function orderFrontmatter(data) {
  const ordered = {};
  for (const key of FIELD_ORDER) {
    if (Object.prototype.hasOwnProperty.call(data, key)) ordered[key] = data[key];
  }
  for (const key of Object.keys(data).sort((a, b) => a.localeCompare(b))) {
    if (!Object.prototype.hasOwnProperty.call(ordered, key)) ordered[key] = data[key];
  }
  return ordered;
}

function standardizeFrontmatterFile(file) {
  const slug = file.replace(/\.md$/, '');
  const filePath = path.join(wikiDir, file);
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(raw);
  const data = parsed.data || {};
  const content = parsed.content.trim();
  const nextData = {
    ...data,
    type: conceptType(slug, data),
    title: pageTitle(slug, data),
    description: pageSummary(data) || firstBodySentence(content) || pageTitle(slug, data),
    tags: asStringArray(data.tags).length ? asStringArray(data.tags) : defaultTags(slug, data),
    timestamp: asString(data.timestamp) || gitTimestamp(file)
  };
  const nextRaw = matter.stringify(`${content}\n`, orderFrontmatter(nextData));
  if (raw !== nextRaw) fs.writeFileSync(filePath, nextRaw);
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
  return fs.existsSync(path.join(publicDir, clean.slice(1)));
}

function wikiMarkdownTarget(href) {
  const clean = decodeURIComponent(href.split('#')[0].split('?')[0]);
  if (clean.startsWith('/wiki/')) {
    return clean.replace(/^\/wiki\//, '').replace(/\/$/, '');
  }
  if (clean.endsWith('.md')) return clean;
  return '';
}

function structuredRelationEdges(page, slugSet, errors) {
  if (page.data.relations === undefined) return [];
  if (!Array.isArray(page.data.relations)) {
    errors.push(`${page.file}: relations must be a list of {type, target, label?} objects`);
    return [];
  }

  const edges = [];
  for (const [index, rawRelation] of page.data.relations.entries()) {
    const relationObject = asObject(rawRelation);
    if (!relationObject) {
      errors.push(`${page.file}: relations[${index}] must be an object`);
      continue;
    }

    const relation = normalizeRelationType(relationObject.type || relationObject.relation);
    if (!STRUCTURED_RELATIONS.has(relation)) {
      errors.push(`${page.file}: relations[${index}] has unsupported type "${relation || '(empty)'}"`);
      continue;
    }

    const targetValue = asString(relationObject.target || relationObject.to);
    const target = resolveWikiTarget(page, targetValue, slugSet);
    if (!targetValue || !target || !slugSet.has(target)) {
      errors.push(`${page.file}: relations[${index}] missing target ${targetValue || '(empty)'}`);
      continue;
    }

    edges.push({
      from: page.slug,
      label: asString(relationObject.label || relationObject.description),
      relation,
      source: 'frontmatter',
      to: target
    });
  }

  return edges;
}

function lifecycleFor(page) {
  const status = asString(page.data.status).toLowerCase();
  const type = page.type.toLowerCase();
  if (page.hidden) {
    return {
      status: 'private',
      confidence: 0.55,
      review: 'manual before publication',
      retention: 'exclude from public bundle until explicitly unhidden'
    };
  }
  if (status === 'accepted' || status === 'published') {
    return {
      status: 'confirmed',
      confidence: 0.95,
      review: 'on venue/status change',
      retention: 'long-lived semantic memory'
    };
  }
  if (status.includes('review') || type.includes('research concept') || type.includes('研究概念')) {
    return {
      status: 'active',
      confidence: 0.8,
      review: 'periodic or when linked evidence changes',
      retention: 'semantic memory with quality warnings'
    };
  }
  return {
    status: 'active',
    confidence: 0.9,
    review: 'periodic',
    retention: 'semantic memory'
  };
}

function parsePage(file) {
  const slug = file.replace(/\.md$/, '');
  const filePath = path.join(wikiDir, file);
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(raw);
  const data = parsed.data || {};
  const page = {
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
  page.lifecycle = lifecycleFor(page);
  return page;
}

function sourceHash(files) {
  const hash = crypto.createHash('sha256');
  for (const file of files) {
    hash.update(file);
    hash.update('\0');
    hash.update(fs.readFileSync(path.join(wikiDir, file)));
    hash.update('\0');
  }
  return hash.digest('hex');
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
    if (!page.type) errors.push(`${page.file}: missing explicit OKF type`);
    if (!page.summary && !RESERVED_SLUGS.has(page.slug)) errors.push(`${page.file}: missing OKF description`);
    if (asStringArray(page.data.tags).length === 0) errors.push(`${page.file}: missing OKF tags`);
    if (!asString(page.data.timestamp)) errors.push(`${page.file}: missing OKF timestamp`);
    if (!asString(page.data.type)) errors.push(`${page.file}: type must be explicit in source frontmatter`);
    if (!asString(page.data.title)) errors.push(`${page.file}: title must be explicit in source frontmatter`);
    if (!asString(page.data.description)) errors.push(`${page.file}: description must be explicit in source frontmatter`);

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
        source: 'body',
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
          edges.push({ from: page.slug, label: '', relation: 'markdown-link', source: 'body', to: slug });
        }
      } else if (!publicAssetExists(href)) {
        errors.push(`${page.file}: missing public asset (${href})`);
      }
    }

    page.structuredRelations = structuredRelationEdges(page, slugSet, errors);
    for (const edge of page.structuredRelations) {
      outgoing.add(edge.to);
      edges.push(edge);
    }

    nodeMap.set(page.slug, {
      aliases: page.aliases,
      file: page.file,
      hidden: page.hidden,
      language: page.language,
      lifecycle: page.lifecycle,
      outgoing: [...outgoing].sort((a, b) => a.localeCompare(b)),
      relationTypes: uniqueStrings(edges.filter((edge) => edge.from === page.slug).map((edge) => edge.relation)).sort((a, b) => a.localeCompare(b)),
      slug: page.slug,
      summary: page.summary,
      tags: page.tags,
      timestamp: asString(page.data.timestamp),
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
      tags: node.tags,
      timestamp: node.timestamp
    }));

  const typeCounts = {};
  const languageCounts = {};
  for (const node of nodes) {
    typeCounts[node.type] = (typeCounts[node.type] || 0) + 1;
    languageCounts[node.language] = (languageCounts[node.language] || 0) + 1;
  }

  const graph = {
    schemaVersion: GRAPH_SCHEMA_VERSION,
    okfVersion: OKF_VERSION,
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
    schemaVersion: PAGE_INDEX_SCHEMA_VERSION,
    okfVersion: OKF_VERSION,
    pages: publicPages.sort((a, b) => {
      if (a.language !== b.language) return a.language.localeCompare(b.language);
      return a.title.localeCompare(b.title) || a.slug.localeCompare(b.slug);
    })
  };

  const schema = createMaintenanceSchema(graph);
  const okf = createOkfBundle({ files, graph, index, pages, schema, sourceDigest: sourceHash(files) });

  return { errors, graph, index, okf, schema, warnings };
}

function createMaintenanceSchema(graph) {
  return {
    schemaVersion: SOURCE_SCHEMA_VERSION,
    okfVersion: OKF_VERSION,
    purpose: 'Schema contract for maintaining Xinbaopedia as an agent-readable academic wiki.',
    source: {
      canonicalDirectory: 'wiki',
      conceptFiles: 'wiki/*.md',
      requiredFrontmatter: ['type', 'title', 'description', 'tags', 'timestamp'],
      recommendedFrontmatter: ['resource', 'aliases', 'links', 'summary', 'hidden', 'language', 'relations'],
      reservedSiteSlugs: [...RESERVED_SLUGS].sort()
    },
    lifecycle: {
      conceptLevelFields: ['status', 'confidence', 'review', 'retention'],
      policy: 'Concept-level lifecycle metadata is generated into graph and OKF exports. Claim-level confidence can be added later without changing the source contract.',
      statuses: ['active', 'confirmed', 'private']
    },
    relations: {
      frontmatterShape: [{ type: 'depends-on', target: 'Synthetic_Data', label: 'optional human note' }],
      supported: [...SUPPORTED_RELATIONS].sort(),
      structured: [...STRUCTURED_RELATIONS].sort()
    },
    qualityGates: [
      'Every source markdown file must parse as YAML frontmatter plus markdown body.',
      'Every source concept must have explicit OKF-compatible type/title/description/tags/timestamp.',
      'Every check run must finish with zero warnings; use --allow-warnings only for local diagnosis.',
      'Hidden pages must be excluded from public page indexes and public OKF bundle exports.',
      'Internal WikiLinks and markdown links must resolve.',
      'Structured frontmatter relations must use a supported relation type and resolve to a source page.',
      'Generated graph, page index, schema, and OKF export must be fresh.'
    ],
    generatedArtifacts: [
      'wiki/pages.json',
      'wiki/graph.json',
      'wiki/maintenance-schema.json',
      'public/okf/index.md',
      'public/okf/log.md',
      'public/okf/manifest.json',
      'public/okf/pages.json',
      'public/okf/graph.json',
      'public/okf/schema.json',
      'public/okf/concepts/*.md'
    ],
    currentTypeCounts: graph.stats.types
  };
}

function okfFrontmatter(page, slugSet) {
  const data = {
    type: page.type,
    title: page.title,
    description: page.summary,
    tags: page.tags,
    timestamp: asString(page.data.timestamp),
    source_path: `wiki/${page.file}`,
    language: page.language,
    lifecycle: page.lifecycle
  };
  if (asString(page.data.resource)) data.resource = asString(page.data.resource);
  if (page.aliases.length) data.aliases = page.aliases;
  const relations = (page.structuredRelations || [])
    .filter((edge) => slugSet.has(edge.to))
    .map((edge) => {
      const relation = { type: edge.relation, target: edge.to };
      if (edge.label) relation.label = edge.label;
      return relation;
    });
  if (relations.length) data.relations = relations;
  return orderFrontmatter(data);
}

function convertWikiLinksToOkf(markdown, page, slugSet) {
  return markdown.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, label) => {
    const resolved = resolveWikiTarget(page, target, slugSet);
    const text = label || String(target).replaceAll('_', ' ');
    if (!resolved || !slugSet.has(resolved)) return `[${text}](./${normalizeSlug(target)}.md)`;
    return `[${text}](./${resolved}.md)`;
  });
}

function createOkfConceptMarkdown(page, slugSet) {
  const body = convertWikiLinksToOkf(page.content, page, slugSet);
  return matter.stringify(`${body}\n`, okfFrontmatter(page, slugSet));
}

function createOkfIndex(index) {
  const byType = new Map();
  for (const page of index.pages) {
    if (!byType.has(page.type)) byType.set(page.type, []);
    byType.get(page.type).push(page);
  }

  const lines = [
    '# Xinbaopedia OKF Bundle',
    '',
    'This bundle exposes the public Xinbaopedia wiki as Markdown concepts with OKF v0.1-compatible frontmatter.',
    '',
    '## Entry Points',
    '',
    '- [Manifest](manifest.json) - bundle metadata and maintenance contract.',
    '- [Graph](graph.json) - generated concept graph, backlinks, lifecycle metadata, and quality warnings.',
    '- [Pages](pages.json) - public page catalog for lightweight consumers.',
    '- [Schema](schema.json) - source and maintenance schema contract.',
    '- [Update log](log.md) - chronological wiki maintenance history.',
    '',
    '## Concepts',
    ''
  ];

  for (const [type, pages] of [...byType.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`### ${type}`, '');
    for (const page of pages.sort((a, b) => a.title.localeCompare(b.title) || a.slug.localeCompare(b.slug))) {
      lines.push(`- [${page.title}](concepts/${page.slug}.md) - ${page.summary}`);
    }
    lines.push('');
  }

  return stableMarkdown(lines.join('\n'));
}

function createOkfLog(pages) {
  const logPage = pages.find((page) => page.slug === 'log');
  const body = logPage ? convertWikiLinksToOkf(logPage.content, logPage, new Set(pages.map((page) => page.slug))) : '';
  return stableMarkdown(`# Xinbaopedia OKF Update Log\n\n${body}`);
}

function createOkfBundle({ files, graph, index, pages, schema, sourceDigest }) {
  const publicPages = pages.filter((page) => !page.hidden);
  const publicSlugSet = new Set(publicPages.map((page) => page.slug));
  const conceptFiles = {};
  for (const page of publicPages.sort((a, b) => a.slug.localeCompare(b.slug))) {
    conceptFiles[`${page.slug}.md`] = createOkfConceptMarkdown(page, publicSlugSet);
  }
  const publicNodeSet = new Set(index.pages.map((page) => page.slug));
  const publicGraph = {
    ...graph,
    nodes: graph.nodes
      .filter((node) => publicNodeSet.has(node.slug))
      .map((node) => ({
        ...node,
        backlinks: node.backlinks.filter((slug) => publicNodeSet.has(slug)),
        outgoing: node.outgoing.filter((slug) => publicNodeSet.has(slug))
      })),
    edges: graph.edges.filter((edge) => publicNodeSet.has(edge.from) && publicNodeSet.has(edge.to)),
    warnings: graph.warnings.filter((warning) => !warning.includes('Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning'))
  };
  publicGraph.stats = {
    ...graph.stats,
    hiddenPages: 0,
    pages: publicGraph.nodes.length,
    publicPages: publicGraph.nodes.length,
    relations: publicGraph.edges.length,
    warnings: publicGraph.warnings.length
  };

  const manifest = {
    schemaVersion: OKF_EXPORT_SCHEMA_VERSION,
    okfVersion: OKF_VERSION,
    name: 'Xinbaopedia public knowledge bundle',
    description: 'Public, agent-readable OKF export of Xinbao Qiao academic wiki content.',
    source: {
      directory: 'wiki',
      files: files.length,
      contentHash: sourceDigest
    },
    bundle: {
      root: 'public/okf',
      concepts: 'concepts/*.md',
      hiddenPagesExcluded: graph.stats.hiddenPages,
      publicPages: index.pages.length
    },
    maintenance: {
      command: 'npm run maintain:wiki',
      check: 'npm run lint:content',
      schema: 'schema.json',
      graph: 'graph.json',
      pages: 'pages.json'
    }
  };

  return {
    conceptFiles,
    graph: publicGraph,
    indexMarkdown: createOkfIndex(index),
    logMarkdown: createOkfLog(pages),
    manifest,
    pages: index,
    schema
  };
}

function assertFresh(filePath, expected) {
  if (!fs.existsSync(filePath)) {
    fail(`${path.relative(root, filePath)} is missing; run npm run maintain:wiki`);
    return;
  }
  const actual = fs.readFileSync(filePath, 'utf8');
  if (actual !== expected) fail(`${path.relative(root, filePath)} is stale; run npm run maintain:wiki`);
}

function writeOkfBundle(okf) {
  fs.rmSync(okfDir, { recursive: true, force: true });
  fs.mkdirSync(okfConceptDir, { recursive: true });
  fs.writeFileSync(okfIndexPath, okf.indexMarkdown);
  fs.writeFileSync(okfLogPath, okf.logMarkdown);
  fs.writeFileSync(okfManifestPath, stableJson(okf.manifest));
  fs.writeFileSync(okfPageIndexPath, stableJson(okf.pages));
  fs.writeFileSync(okfGraphPath, stableJson(okf.graph));
  fs.writeFileSync(okfSchemaPath, stableJson(okf.schema));
  for (const [file, content] of Object.entries(okf.conceptFiles)) {
    fs.writeFileSync(path.join(okfConceptDir, file), content);
  }
}

function assertOkfBundleFresh(okf) {
  assertFresh(okfIndexPath, okf.indexMarkdown);
  assertFresh(okfLogPath, okf.logMarkdown);
  assertFresh(okfManifestPath, stableJson(okf.manifest));
  assertFresh(okfPageIndexPath, stableJson(okf.pages));
  assertFresh(okfGraphPath, stableJson(okf.graph));
  assertFresh(okfSchemaPath, stableJson(okf.schema));
  for (const [file, content] of Object.entries(okf.conceptFiles)) {
    assertFresh(path.join(okfConceptDir, file), content);
  }
  const existing = fs.existsSync(okfConceptDir) ? fs.readdirSync(okfConceptDir).filter((file) => file.endsWith('.md')).sort() : [];
  const expected = Object.keys(okf.conceptFiles).sort();
  if (existing.join('\n') !== expected.join('\n')) {
    fail('public/okf/concepts contains stale or missing concept files; run npm run maintain:wiki');
  }
}

if (standardize) {
  for (const file of markdownFiles()) standardizeFrontmatterFile(file);
}

const result = collect();
const nextIndex = stableJson(result.index);
const nextGraph = stableJson(result.graph);
const nextSchema = stableJson(result.schema);

if (write) {
  fs.writeFileSync(pageIndexPath, nextIndex);
  fs.writeFileSync(graphPath, nextGraph);
  fs.writeFileSync(schemaPath, nextSchema);
  writeOkfBundle(result.okf);
}

if (check) {
  assertFresh(pageIndexPath, nextIndex);
  assertFresh(graphPath, nextGraph);
  assertFresh(schemaPath, nextSchema);
  assertOkfBundleFresh(result.okf);
}

for (const error of result.errors) fail(error);

const summary = {
  errors: result.errors.length,
  graph: result.graph.stats,
  mode: standardize ? 'standardize-write' : write ? 'write' : 'check',
  okf: {
    concepts: Object.keys(result.okf.conceptFiles).length,
    hiddenPagesExcluded: result.graph.stats.hiddenPages,
    path: 'public/okf'
  },
  warnings: result.warnings.length
};

if (result.warnings.length) {
  console.warn(`Wiki maintenance warnings: ${result.warnings.length}`);
  for (const warning of result.warnings.slice(0, 20)) console.warn(`- ${warning}`);
  if (result.warnings.length > 20) console.warn(`- ... ${result.warnings.length - 20} more warnings`);
  if (check && !args.has('--allow-warnings')) {
    fail('Wiki maintenance warnings are treated as check failures; fix them or run with --allow-warnings for local diagnosis.');
  }
}

console.log(JSON.stringify(summary, null, 2));
