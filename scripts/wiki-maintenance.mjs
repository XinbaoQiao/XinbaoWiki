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
const qualityReportPath = path.join(wikiDir, 'quality-report.json');
const sourceRegistryPath = path.join(wikiDir, 'source-registry.json');
const okfQualityReportPath = path.join(okfDir, 'quality-report.json');
const okfSourceRegistryPath = path.join(okfDir, 'sources.json');
const okfIndexPath = path.join(okfDir, 'index.md');
const okfLogPath = path.join(okfDir, 'log.md');

const args = new Set(process.argv.slice(2));
const standardize = args.has('--standardize');
const write = args.has('--write') || standardize;
const check = args.has('--check') || !write;

const OKF_VERSION = '0.1';
const OKF_PROFILE_ID = 'xinbaopedia-okf-profile';
const OKF_PROFILE_VERSION = '1.0';
const SOURCE_SCHEMA_VERSION = 5;
const GRAPH_SCHEMA_VERSION = 4;
const PAGE_INDEX_SCHEMA_VERSION = 4;
const OKF_EXPORT_SCHEMA_VERSION = 3;
const QUALITY_REPORT_SCHEMA_VERSION = 2;
const SOURCE_REGISTRY_SCHEMA_VERSION = 1;
const FALLBACK_TIMESTAMP = '1970-01-01T00:00:00Z';
const HASH_PREFIX = 'sha256:';

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
  'modified',
  'content_hash',
  'reviewed_at',
  'review_due',
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
  'image_alt',
  'image_caption',
  'image_gallery',
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

const GENERATED_MAINTENANCE_FIELDS = new Set([
  'modified',
  'content_hash',
  'reviewed_at',
  'review_due',
  'source_ids'
]);
const REVIEW_AS_OF = reviewWeekStart(process.env.WIKI_REVIEW_AS_OF);

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

function countBy(items, keyFn) {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function hashString(value) {
  return `${HASH_PREFIX}${crypto.createHash('sha256').update(value).digest('hex')}`;
}

function sortForHash(value) {
  if (Array.isArray(value)) return value.map((item) => sortForHash(item));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => [key, sortForHash(value[key])])
  );
}

function pageContentHash(data, content) {
  const canonicalData = Object.fromEntries(
    Object.entries(data || {}).filter(([key]) => !GENERATED_MAINTENANCE_FIELDS.has(key))
  );
  const canonicalBody = String(content || '').replace(/\r\n?/g, '\n').trim();
  return hashString(`${JSON.stringify(sortForHash(canonicalData))}\0${canonicalBody}\n`);
}

function validDate(value) {
  const text = asString(value);
  return text && !Number.isNaN(Date.parse(text)) ? text : '';
}

function latestTimestamp(...values) {
  return values
    .map((value) => validDate(value))
    .filter(Boolean)
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0] || FALLBACK_TIMESTAMP;
}

function dateOnly(value) {
  const timestamp = validDate(value);
  return timestamp ? new Date(timestamp).toISOString().slice(0, 10) : '';
}

function addDays(value, days) {
  const timestamp = validDate(value);
  if (!timestamp) return '';
  const date = new Date(timestamp);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function reviewWeekStart(value = '') {
  const explicit = validDate(value);
  const date = explicit ? new Date(explicit) : new Date();
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

function reviewIntervalDays(slug, data) {
  const status = asString(data.status).toLowerCase();
  const type = conceptType(slug, data).toLowerCase();
  if (status.includes('review') || status.includes('submission')) return 30;
  if (type.includes('publication') || type.includes('论文')) return status === 'accepted' || status === 'published' ? 365 : 90;
  if (
    type.includes('phd student') ||
    type.includes('博士生') ||
    type.includes('cv') ||
    type.includes('profile') ||
    type.includes('经历') ||
    type.includes('experience') ||
    type.includes('overview') ||
    type.includes('概览')
  ) return 90;
  if (
    type.includes('log') ||
    type.includes('日志') ||
    type.includes('index') ||
    type.includes('索引') ||
    type.includes('style') ||
    type.includes('resource') ||
    type.includes('资源')
  ) return 365;
  return 180;
}

function trimUrlPunctuation(value) {
  return value.replace(/[)\]}>.,;:!?，。；：！？]+$/g, '');
}

function canonicalUrl(value) {
  try {
    const parsed = new URL(trimUrlPunctuation(value));
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    parsed.hash = '';
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$)/i.test(key)) parsed.searchParams.delete(key);
    }
    parsed.hostname = parsed.hostname.toLowerCase();
    return parsed.toString();
  } catch {
    return '';
  }
}

function sourceKind(url) {
  const { hostname, pathname } = new URL(url);
  if (hostname === 'openreview.net' && pathname.startsWith('/profile')) return 'researcher-profile';
  if (hostname === 'arxiv.org' || hostname === 'openreview.net' || hostname === 'doi.org') return 'scholarly-publication';
  if (
    hostname === 'proceedings.mlr.press' ||
    hostname === 'epubs.siam.org' ||
    hostname === 'ojs.aaai.org' ||
    pathname.toLowerCase().endsWith('.pdf')
  ) return 'scholarly-publication';
  if (hostname === 'github.com') return 'code-repository';
  if (hostname === 'orcid.org') return 'researcher-identifier';
  if (hostname === 'scholar.google.com' || hostname === 'dblp.uni-trier.de') return 'bibliographic-profile';
  if (hostname === 'linkedin.com' || hostname === 'www.linkedin.com' || hostname === 'huggingface.co') return 'public-profile';
  if (/icml\.cc$|aaai\.org$|neurips\.cc$|iclr\.cc$/.test(hostname)) return 'conference-site';
  if (/\.(edu|ac\.uk|edu\.cn|edu\.hk)$/.test(hostname) || /cuhk\.edu\.hk$|zju\.edu\.cn$|sdu\.edu\.cn$|nus\.edu\.sg$/.test(hostname)) {
    return 'institutional-source';
  }
  return 'web-reference';
}

function sourceMaxAgeDays(kind) {
  if (kind === 'conference-site') return 30;
  if (kind === 'researcher-profile' || kind === 'public-profile' || kind === 'institutional-source') return 90;
  if (kind === 'code-repository') return 90;
  return 180;
}

function httpUrlsInText(value) {
  return [...String(value || '').matchAll(/https?:\/\/[^\s<>"'()[\]{}，。；、！？“”]+/gu)]
    .map((match) => match[0].replace(/[.,;:!?]+$/g, ''))
    .filter(Boolean);
}

function collectValueUrls(value, location, results) {
  if (typeof value === 'string') {
    for (const rawUrl of httpUrlsInText(value)) {
      const url = canonicalUrl(rawUrl);
      if (url) results.push({ citation: false, footnote: false, location, url });
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectValueUrls(item, `${location}[${index}]`, results));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      if (GENERATED_MAINTENANCE_FIELDS.has(key)) continue;
      collectValueUrls(nested, location ? `${location}.${key}` : key, results);
    }
  }
}

function sourceEvidenceForPage(data, content) {
  const results = [];
  collectValueUrls(data, 'frontmatter', results);
  for (const [index, line] of String(content || '').split('\n').entries()) {
    const footnote = /^\s*\[\^[^\]]+\]:/.test(line);
    for (const rawUrl of httpUrlsInText(line)) {
      const url = canonicalUrl(rawUrl);
      if (url) results.push({ citation: true, footnote, location: footnote ? 'body.footnote' : 'body', line: index + 1, url });
    }
  }
  const unique = new Map();
  for (const evidence of results) {
    const key = `${evidence.url}\0${evidence.location}\0${evidence.line || ''}`;
    unique.set(key, evidence);
  }
  return [...unique.values()].sort((a, b) => `${a.url}:${a.location}:${a.line || 0}`.localeCompare(`${b.url}:${b.location}:${b.line || 0}`));
}

function sourceId(url) {
  return `src-${hashString(url).slice(HASH_PREFIX.length, HASH_PREFIX.length + 16)}`;
}

function createSourceRegistry(pages, { publicMode = false, attachToPages = false } = {}) {
  const sourceMap = new Map();
  for (const page of pages) {
    if (publicMode && page.hidden) continue;
    const pageSourceIds = new Set();
    const pageCitationSourceIds = new Set();
    const pageFootnoteSourceIds = new Set();
    for (const evidence of page.sourceEvidence) {
      const id = sourceId(evidence.url);
      pageSourceIds.add(id);
      if (evidence.citation) pageCitationSourceIds.add(id);
      if (evidence.footnote) pageFootnoteSourceIds.add(id);
      if (!sourceMap.has(id)) {
        const kind = sourceKind(evidence.url);
        sourceMap.set(id, {
          id,
          url: evidence.url,
          kind,
          hash: {
            algorithm: 'sha256',
            scope: 'canonical-url',
            value: hashString(evidence.url)
          },
          check: {
            method: 'scheduled-http-head-or-get',
            status: 'not-checked',
            checkedAt: null,
            contentHash: null,
            maxAgeDays: sourceMaxAgeDays(kind)
          },
          pages: new Map()
        });
      }
      const source = sourceMap.get(id);
      if (!source.pages.has(page.slug)) {
        source.pages.set(page.slug, { citation: false, footnote: false, locations: new Set() });
      }
      const pageEvidence = source.pages.get(page.slug);
      pageEvidence.citation ||= evidence.citation;
      pageEvidence.footnote ||= evidence.footnote;
      pageEvidence.locations.add(evidence.location);
    }
    if (attachToPages) {
      page.sourceIds = [...pageSourceIds].sort((a, b) => a.localeCompare(b));
      page.citationSourceIds = [...pageCitationSourceIds].sort((a, b) => a.localeCompare(b));
      page.footnoteSourceIds = [...pageFootnoteSourceIds].sort((a, b) => a.localeCompare(b));
    }
  }

  const sources = [...sourceMap.values()]
    .map((source) => {
      const evidence = [...source.pages.entries()]
        .map(([slug, details]) => ({
          slug,
          locations: [...details.locations].sort((a, b) => a.localeCompare(b)),
          citation: details.citation,
          footnote: details.footnote
        }))
        .sort((a, b) => a.slug.localeCompare(b.slug));
      return {
        id: source.id,
        url: source.url,
        kind: source.kind,
        hash: source.hash,
        check: source.check,
        pages: evidence.map((item) => item.slug),
        evidence
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    schemaVersion: SOURCE_REGISTRY_SCHEMA_VERSION,
    okfVersion: OKF_VERSION,
    profile: {
      id: OKF_PROFILE_ID,
      version: OKF_PROFILE_VERSION
    },
    identity: {
      strategy: 'src- plus the first 16 hexadecimal characters of SHA-256(canonical URL)',
      canonicalization: 'WHATWG URL normalization; fragments and common tracking parameters are removed'
    },
    hashSemantics: {
      identity: 'hash.value is SHA-256 of the canonical URL and is stable across page associations',
      content: 'check.contentHash remains null until a scheduled or manual source snapshot audit records remote content'
    },
    checkPolicy: {
      defaultMethod: 'scheduled-http-head-or-get',
      uncheckedStatus: 'not-checked',
      allowedStatuses: ['not-checked', 'ok', 'redirected', 'unavailable', 'error'],
      maxAgeDaysByKind: {
        'conference-site': 30,
        'code-repository': 90,
        'institutional-source': 90,
        'public-profile': 90,
        'researcher-profile': 90,
        default: 180
      },
      meaning: 'Registry generation proves declaration and page association, not remote availability or factual correctness'
    },
    contentHash: hashString(JSON.stringify(sortForHash(sources))),
    sources
  };
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
  const baseData = {
    ...data,
    type: conceptType(slug, data),
    title: pageTitle(slug, data),
    description: pageSummary(data) || firstBodySentence(content) || pageTitle(slug, data),
    tags: asStringArray(data.tags).length ? asStringArray(data.tags) : defaultTags(slug, data),
    timestamp: asString(data.timestamp) || gitTimestamp(file)
  };
  const contentHash = pageContentHash(baseData, content);
  const storedHash = asString(data.content_hash);
  const existingModified = validDate(data.modified);
  let modified = existingModified || latestTimestamp(baseData.timestamp, gitTimestamp(file));
  if (storedHash !== contentHash) {
    const priorReviewTime = Date.parse(validDate(data.reviewed_at) || '');
    // A content change must always become newer than every prior review,
    // including a stale reviewed_at that happened to be later than modified.
    // This forces a two-pass workflow: capture the edit first, then explicitly
    // advance reviewed_at only after reviewing the newly hashed content.
    modified = new Date(Math.max(Date.now(), Number.isFinite(priorReviewTime) ? priorReviewTime + 1 : 0)).toISOString();
  }
  // Review provenance is an explicit human assertion. The one-time migration
  // has already populated existing pages; never infer review completion for a
  // new page (or repair a deleted reviewed_at) from file/Git timestamps.
  const reviewedAt = validDate(data.reviewed_at);
  const nextData = {
    ...baseData,
    modified,
    content_hash: contentHash
  };
  if (reviewedAt) {
    nextData.reviewed_at = reviewedAt;
    nextData.review_due = addDays(reviewedAt, reviewIntervalDays(slug, baseData));
  } else {
    delete nextData.reviewed_at;
    delete nextData.review_due;
  }
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

function hasExplicitEnglishLabel(label) {
  return /English|英文/i.test(asString(label));
}

function shouldPreserveResolvedTarget(sourcePage, target, resolved, label) {
  const normalizedTarget = normalizeSlug(stripTargetSuffix(target));
  if (sourcePage.language === 'en' && isChineseSlug(resolved) && isChineseSlug(normalizedTarget)) return true;
  if (sourcePage.language === 'zh' && !isChineseSlug(resolved) && hasExplicitEnglishLabel(label)) return true;
  return false;
}

function resolveWikiTarget(sourcePage, target, slugSet, label = '') {
  const resolved = resolveSlug(target, slugSet);
  if (!resolved || !slugSet.has(resolved)) return resolved;
  if (shouldPreserveResolvedTarget(sourcePage, target, resolved, label)) return resolved;
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
      const target = resolveWikiTarget(page, targetValue, slugSet, relationObject.label || relationObject.description);
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
      retention: 'exclude from public bundle until explicitly unhidden',
      reviewedAt: page.reviewedAt,
      reviewDue: page.reviewDue,
      pendingReview: page.pendingReview,
      overdue: page.overdue
    };
  }
  if (status === 'accepted' || status === 'published') {
    return {
      status: 'confirmed',
      confidence: 0.95,
      review: 'on venue/status change',
      retention: 'long-lived semantic memory',
      reviewedAt: page.reviewedAt,
      reviewDue: page.reviewDue,
      pendingReview: page.pendingReview,
      overdue: page.overdue
    };
  }
  if (status.includes('review') || type.includes('research concept') || type.includes('研究概念')) {
    return {
      status: 'active',
      confidence: 0.8,
      review: 'periodic or when linked evidence changes',
      retention: 'semantic memory with quality warnings',
      reviewedAt: page.reviewedAt,
      reviewDue: page.reviewDue,
      pendingReview: page.pendingReview,
      overdue: page.overdue
    };
  }
  return {
    status: 'active',
    confidence: 0.9,
    review: 'periodic',
    retention: 'semantic memory',
    reviewedAt: page.reviewedAt,
    reviewDue: page.reviewDue,
    pendingReview: page.pendingReview,
    overdue: page.overdue
  };
}

function parsePage(file) {
  const slug = file.replace(/\.md$/, '');
  const filePath = path.join(wikiDir, file);
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(raw);
  const data = parsed.data || {};
  const content = parsed.content.trim();
  const modifiedAt = validDate(data.modified);
  const reviewedAt = validDate(data.reviewed_at);
  const reviewDue = dateOnly(data.review_due);
  const page = {
    aliases: asStringArray(data.aliases),
    citationSourceIds: [],
    content,
    contentHash: pageContentHash(data, content),
    data,
    file,
    footnoteSourceIds: [],
    hidden: data.hidden === true,
    language: isChineseSlug(slug) ? 'zh' : 'en',
    slug,
    sourceEvidence: sourceEvidenceForPage(data, content),
    sourceIds: [],
    summary: pageSummary(data),
    tags: asStringArray(data.tags),
    title: pageTitle(slug, data),
    translationOf: asString(data.translation_of),
    type: conceptType(slug, data),
    modifiedAt,
    reviewedAt,
    reviewDue,
    pendingReview: Boolean(modifiedAt && reviewedAt && Date.parse(modifiedAt) > Date.parse(reviewedAt)),
    overdue: Boolean(reviewDue && reviewDue < REVIEW_AS_OF),
    reviewIntervalDays: reviewIntervalDays(slug, data)
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

  const sourceRegistry = createSourceRegistry(pages, { attachToPages: true });
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
    if (!page.modifiedAt) errors.push(`${page.file}: modified must be a valid timestamp`);
    if (!page.reviewedAt) errors.push(`${page.file}: reviewed_at must be a valid timestamp`);
    if (!page.reviewDue) errors.push(`${page.file}: review_due must be a valid date`);
    if (asString(page.data.content_hash) !== page.contentHash) {
      errors.push(`${page.file}: content_hash does not match canonical frontmatter plus body; run npm run maintain:wiki`);
    }
    if (page.reviewedAt && page.reviewDue && page.reviewDue <= dateOnly(page.reviewedAt)) {
      errors.push(`${page.file}: review_due must be later than reviewed_at`);
    }
    if (page.pendingReview) {
      errors.push(`${page.file}: content changed after reviewed_at; review the page and advance reviewed_at`);
    }
    if (page.overdue) {
      warnings.push(`${page.file}: review_due ${page.reviewDue} is overdue as of ${REVIEW_AS_OF}`);
    }

    const outgoing = new Set();
    for (const match of page.content.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)) {
      const target = resolveWikiTarget(page, match[1], slugSet, match[2] || '');
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
      if (/^(https?:|mailto:|tel:|#)/.test(href)) continue;
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
      citationSourceIds: page.citationSourceIds,
      contentHash: page.contentHash,
      file: page.file,
      footnoteSourceIds: page.footnoteSourceIds,
      hidden: page.hidden,
      language: page.language,
      lifecycle: page.lifecycle,
      modifiedAt: page.modifiedAt,
      outgoing: [...outgoing].sort((a, b) => a.localeCompare(b)),
      relationTypes: uniqueStrings(edges.filter((edge) => edge.from === page.slug).map((edge) => edge.relation)).sort((a, b) => a.localeCompare(b)),
      slug: page.slug,
      sourceIds: page.sourceIds,
      summary: page.summary,
      tags: page.tags,
      timestamp: asString(page.data.timestamp),
      title: page.title,
      type: page.type,
      reviewedAt: page.reviewedAt,
      reviewDue: page.reviewDue,
      retrieval: {
        documentId: `wiki:${page.slug}`,
        chunking: 'markdown-heading-v1',
        contentHash: page.contentHash,
        textFields: ['title', 'aliases', 'summary', 'body'],
        metadataFields: ['slug', 'language', 'type', 'tags', 'sourceIds', 'reviewedAt', 'reviewDue']
      }
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

  const pageBySlug = new Map(pages.map((page) => [page.slug, page]));
  const missingTranslationPairs = [];
  const translationWarnings = [];
  for (const node of nodes) {
    if (node.hidden || RESERVED_SLUGS.has(node.slug)) continue;
    const page = pageBySlug.get(node.slug);
    if (node.language === 'en') {
      const expected = chineseCounterpart(node.slug);
      if (!slugSet.has(expected)) {
        const warning = `${node.file}: missing Chinese counterpart ${expected}.md`;
        warnings.push(warning);
        translationWarnings.push(warning);
        missingTranslationPairs.push({
          source: node.slug,
          expected,
          missingLanguage: 'zh',
          reason: 'derived counterpart slug is missing'
        });
      }
    } else {
      const expected = page?.translationOf || englishCounterpart(node.slug);
      if (!slugSet.has(expected)) {
        const warning = `${node.file}: missing English counterpart ${expected}.md`;
        warnings.push(warning);
        translationWarnings.push(warning);
        missingTranslationPairs.push({
          source: node.slug,
          expected,
          missingLanguage: 'en',
          reason: page?.translationOf ? 'translation_of target is missing' : 'derived counterpart slug is missing'
        });
      } else {
        const derived = englishCounterpart(node.slug);
        if (page?.translationOf && page.translationOf !== derived) {
          const warning = `${node.file}: translation_of ${page.translationOf} does not match derived counterpart ${derived}`;
          warnings.push(warning);
          translationWarnings.push(warning);
          missingTranslationPairs.push({
            source: node.slug,
            expected: derived,
            actual: page.translationOf,
            missingLanguage: 'en',
            reason: 'translation_of does not match the slug-derived counterpart'
          });
        }
      }
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

  const structuredRelationCounts = {};
  for (const relation of STRUCTURED_RELATIONS) structuredRelationCounts[relation] = 0;
  for (const edge of edges) {
    if (STRUCTURED_RELATIONS.has(edge.relation)) structuredRelationCounts[edge.relation] += 1;
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
      timestamp: node.timestamp,
      modifiedAt: node.modifiedAt,
      contentHash: node.contentHash,
      reviewedAt: node.reviewedAt,
      reviewDue: node.reviewDue,
      sourceIds: node.sourceIds,
      citationSourceIds: node.citationSourceIds,
      footnoteSourceIds: node.footnoteSourceIds,
      retrieval: node.retrieval
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

  const qualityReport = createQualityReport({
    duplicateTitles,
    graph,
    missingTranslationPairs,
    publicMode: false,
    sourceRegistry,
    structuredRelationCounts,
    translationWarnings
  });

  const index = {
    schemaVersion: PAGE_INDEX_SCHEMA_VERSION,
    okfVersion: OKF_VERSION,
    pages: publicPages.sort((a, b) => {
      if (a.language !== b.language) return a.language.localeCompare(b.language);
      return a.title.localeCompare(b.title) || a.slug.localeCompare(b.slug);
    })
  };

  const schema = createMaintenanceSchema(graph);
  const okf = createOkfBundle({ files, graph, index, pages, qualityReport, schema, sourceDigest: sourceHash(files) });

  return { errors, graph, index, okf, qualityReport, schema, sourceRegistry, warnings };
}

function createQualityReport({ duplicateTitles, graph, missingTranslationPairs, publicMode, sourceRegistry, structuredRelationCounts, translationWarnings }) {
  const visibleNodes = graph.nodes.filter((node) => !node.hidden);
  const ratio = (value, total) => total === 0 ? 1 : Number((value / total).toFixed(4));
  const pageSummaryForReport = (node) => ({
    slug: node.slug,
    title: node.title,
    language: node.language,
    modifiedAt: node.modifiedAt,
    reviewedAt: node.reviewedAt,
    reviewDue: node.reviewDue
  });
  const ignoredConnectivitySlugs = new Set([...HOME_SLUGS]);
  const orphanPages = visibleNodes
    .filter((node) => !ignoredConnectivitySlugs.has(node.slug) && node.backlinks.length === 0)
    .map((node) => ({ slug: node.slug, file: node.file, title: node.title, language: node.language }));
  const noOutgoingPages = visibleNodes
    .filter((node) => !ignoredConnectivitySlugs.has(node.slug) && node.outgoing.length === 0)
    .map((node) => ({ slug: node.slug, file: node.file, title: node.title, language: node.language }));
  const duplicateTitleGroups = [...duplicateTitles.entries()]
    .filter(([, files]) => files.length > 1)
    .map(([key, files]) => ({ key, files }))
    .sort((a, b) => a.key.localeCompare(b.key));
  const hiddenNodes = graph.nodes
    .filter((node) => node.hidden)
    .map((node) => ({ slug: node.slug, file: node.file, title: node.title, language: node.language }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const pagesWithSources = visibleNodes.filter((node) => node.sourceIds.length > 0);
  const pagesWithBodyCitations = visibleNodes.filter((node) => node.citationSourceIds.length > 0);
  const pagesWithFootnoteCitations = visibleNodes.filter((node) => node.footnoteSourceIds.length > 0);
  const pagesWithTypedRelations = visibleNodes.filter((node) => node.relationTypes.some((relation) => STRUCTURED_RELATIONS.has(relation)));
  const structuredEdges = graph.edges.filter((edge) => STRUCTURED_RELATIONS.has(edge.relation));
  const overduePages = visibleNodes.filter((node) => node.lifecycle.overdue).map(pageSummaryForReport);
  const pendingReviewPages = visibleNodes.filter((node) => node.lifecycle.pendingReview).map(pageSummaryForReport);
  const currentPages = visibleNodes.filter((node) => !node.lifecycle.overdue && !node.lifecycle.pendingReview);
  const readyPages = visibleNodes.filter((node) => (
    node.contentHash.startsWith(HASH_PREFIX) &&
    node.title &&
    node.summary &&
    node.language &&
    node.tags.length > 0 &&
    node.retrieval?.documentId === `wiki:${node.slug}`
  ));
  const nextReviewDue = visibleNodes
    .map((node) => node.reviewDue)
    .filter((value) => value && value >= REVIEW_AS_OF)
    .sort((a, b) => a.localeCompare(b))[0] || null;

  return {
    schemaVersion: QUALITY_REPORT_SCHEMA_VERSION,
    okfVersion: OKF_VERSION,
    counts: {
      pages: graph.stats.pages,
      publicPages: graph.stats.publicPages,
      hiddenPages: graph.stats.hiddenPages,
      edges: graph.stats.relations,
      warnings: publicMode ? 0 : graph.stats.warnings,
      languages: graph.stats.languages,
      types: graph.stats.types
    },
    warnings: publicMode ? [] : graph.warnings,
    hiddenPages: publicMode
      ? { count: hiddenNodes.length, pages: [], redacted: true }
      : { count: hiddenNodes.length, pages: hiddenNodes },
    duplicateTitleGroups,
    orphanPages,
    noOutgoingPages,
    missingTranslationPairs: publicMode
      ? missingTranslationPairs.filter((pair) => graph.nodes.some((node) => node.slug === pair.source && !node.hidden))
      : missingTranslationPairs,
    translationConsistency: {
      warnings: publicMode ? [] : translationWarnings.sort((a, b) => a.localeCompare(b)),
      missingPairs: publicMode
        ? missingTranslationPairs.filter((pair) => graph.nodes.some((node) => node.slug === pair.source && !node.hidden))
        : missingTranslationPairs
    },
    structuredRelationCounts: Object.fromEntries(Object.entries(structuredRelationCounts).sort(([a], [b]) => a.localeCompare(b))),
    sourceCoverage: {
      pages: visibleNodes.length,
      pagesWithSources: pagesWithSources.length,
      pagesWithoutSources: visibleNodes.filter((node) => node.sourceIds.length === 0).map(pageSummaryForReport),
      coverage: ratio(pagesWithSources.length, visibleNodes.length),
      registeredSources: sourceRegistry?.sources.length || 0
    },
    citationCoverage: {
      pages: visibleNodes.length,
      pagesWithBodyCitations: pagesWithBodyCitations.length,
      pagesWithFootnoteCitations: pagesWithFootnoteCitations.length,
      pagesWithoutBodyCitations: visibleNodes.filter((node) => node.citationSourceIds.length === 0).map(pageSummaryForReport),
      coverage: ratio(pagesWithBodyCitations.length, visibleNodes.length),
      footnoteCoverage: ratio(pagesWithFootnoteCitations.length, visibleNodes.length)
    },
    reviewFreshness: {
      asOf: REVIEW_AS_OF,
      policy: 'review status is recalculated at the start of each UTC week',
      currentPages: currentPages.length,
      overduePages,
      pendingReviewPages,
      nextReviewDue
    },
    typedRelationCoverage: {
      pages: visibleNodes.length,
      pagesWithTypedRelations: pagesWithTypedRelations.length,
      pagesWithoutTypedRelations: visibleNodes.filter((node) => !pagesWithTypedRelations.includes(node)).map(pageSummaryForReport),
      coverage: ratio(pagesWithTypedRelations.length, visibleNodes.length),
      structuredEdges: structuredEdges.length,
      totalEdges: graph.edges.length
    },
    retrievalReadiness: {
      pages: visibleNodes.length,
      readyPages: readyPages.length,
      missingMetadataPages: visibleNodes.filter((node) => !readyPages.includes(node)).map(pageSummaryForReport),
      coverage: ratio(readyPages.length, visibleNodes.length),
      contract: 'markdown-heading-v1 with stable wiki:<slug> document IDs and content hashes'
    }
  };
}

function createMaintenanceSchema(graph) {
  return {
    schemaVersion: SOURCE_SCHEMA_VERSION,
    okfVersion: OKF_VERSION,
    purpose: 'Schema contract for maintaining Xinbaopedia as an agent-readable academic wiki.',
    profile: {
      id: OKF_PROFILE_ID,
      version: OKF_PROFILE_VERSION,
      base: 'Google Cloud Open Knowledge Format v0.1 draft',
      conformance: 'strict project profile layered on OKF v0.1; profile extensions use additional frontmatter and generated JSON fields',
      compatibility: 'OKF consumers may ignore unknown Xinbaopedia profile fields'
    },
    source: {
      canonicalDirectory: 'wiki',
      conceptFiles: 'wiki/*.md',
      requiredFrontmatter: ['type', 'title', 'description', 'tags', 'timestamp'],
      recommendedFrontmatter: ['modified', 'content_hash', 'reviewed_at', 'review_due', 'resource', 'aliases', 'links', 'summary', 'hidden', 'language', 'relations'],
      fieldSemantics: {
        timestamp: 'Initial knowledge-record timestamp retained for OKF v0.1 compatibility; it is not a last-modified field.',
        modified: 'Last substantive edit time. On a canonical content-hash change it advances strictly beyond every prior review, forcing the new revision into pending review.',
        content_hash: 'SHA-256 of canonical frontmatter plus body after generated maintenance fields are removed.',
        reviewed_at: 'Explicit maintainer assertion that the current substantive content received editorial review. Existing values created by the 2026 lifecycle migration remain migration baselines and do not prove remote-source revalidation. New pages and later reviews must set this field explicitly; maintenance never infers it.',
        review_due: 'Derived date for the next review, based on page type and reviewed_at.'
      },
      reservedSiteSlugs: [...RESERVED_SLUGS].sort()
    },
    lifecycle: {
      conceptLevelFields: ['status', 'confidence', 'review', 'retention', 'modified', 'content_hash', 'reviewed_at', 'review_due'],
      policy: 'Content changed after reviewed_at is a hard error. Pages past review_due become warnings and fail the default check. Review status is evaluated at the start of each UTC week; WIKI_REVIEW_AS_OF may pin an audit date.',
      migration: 'The completed 2026 migration initialized existing modified and reviewed_at values from Git/source timestamps. That historical bootstrap does not verify remote sources and is not applied to new or repaired pages.',
      statuses: ['active', 'confirmed', 'private']
    },
    sources: {
      registry: 'wiki/source-registry.json',
      publicRegistry: 'public/okf/sources.json',
      identity: 'Stable source IDs derive from canonical URL SHA-256 and do not depend on page associations.',
      verificationBoundary: 'Generated status not-checked proves only that a URL was declared and associated; scheduled or manual HTTP audits establish availability and remote content hashes.'
    },
    retrieval: {
      documentId: 'wiki:<slug>',
      chunking: 'markdown-heading-v1',
      requiredMetadata: ['slug', 'language', 'type', 'tags', 'contentHash', 'sourceIds', 'reviewedAt', 'reviewDue']
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
      'Every content hash must exclude generated maintenance fields and match canonical page content.',
      'Missing reviewed_at is a hard error; maintenance never infers review completion.',
      'Content modified after reviewed_at must be reviewed before checks pass.',
      'Source IDs must resolve through the generated registry; not-checked sources are declarations, not verified facts.',
      'Generated graph, page index, schema, and OKF export must be fresh.'
    ],
    generatedArtifacts: [
      'wiki/pages.json',
      'wiki/graph.json',
      'wiki/maintenance-schema.json',
      'wiki/quality-report.json',
      'wiki/source-registry.json',
      'public/okf/index.md',
      'public/okf/log.md',
      'public/okf/manifest.json',
      'public/okf/pages.json',
      'public/okf/graph.json',
      'public/okf/quality-report.json',
      'public/okf/schema.json',
      'public/okf/sources.json',
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
    modified: page.modifiedAt,
    content_hash: page.contentHash,
    reviewed_at: page.reviewedAt,
    review_due: page.reviewDue,
    source_path: `wiki/${page.file}`,
    source_ids: page.sourceIds,
    language: page.language,
    lifecycle: page.lifecycle,
    retrieval: {
      document_id: `wiki:${page.slug}`,
      chunking: 'markdown-heading-v1'
    }
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
    const resolved = resolveWikiTarget(page, target, slugSet, label || '');
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
    '- [Sources](sources.json) - stable source IDs, page associations, and verification state.',
    '- [Quality report](quality-report.json) - source, citation, review, relation, and retrieval coverage.',
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

function createOkfBundle({ files, graph, index, pages, qualityReport, schema, sourceDigest }) {
  const publicPages = pages.filter((page) => !page.hidden);
  const publicSlugSet = new Set(publicPages.map((page) => page.slug));
  const sourceRegistry = createSourceRegistry(pages, { publicMode: true });
  const conceptFiles = {};
  for (const page of publicPages.sort((a, b) => a.slug.localeCompare(b.slug))) {
    conceptFiles[`${page.slug}.md`] = createOkfConceptMarkdown(page, publicSlugSet);
  }
  const publicNodeSet = new Set(index.pages.map((page) => page.slug));
  const hiddenFiles = pages.filter((page) => page.hidden).map((page) => page.file);
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
    warnings: graph.warnings.filter((warning) => !hiddenFiles.some((file) => warning.startsWith(`${file}:`)))
  };
  publicGraph.stats = {
    ...graph.stats,
    hiddenPages: 0,
    languages: countBy(publicGraph.nodes, (node) => node.language),
    pages: publicGraph.nodes.length,
    publicPages: publicGraph.nodes.length,
    relations: publicGraph.edges.length,
    types: countBy(publicGraph.nodes, (node) => node.type),
    warnings: publicGraph.warnings.length
  };
  const publicQualityReport = createQualityReport({
    duplicateTitles: new Map(),
    graph: publicGraph,
    missingTranslationPairs: qualityReport.missingTranslationPairs,
    publicMode: true,
    sourceRegistry,
    structuredRelationCounts: Object.fromEntries(
      [...STRUCTURED_RELATIONS]
        .sort((a, b) => a.localeCompare(b))
        .map((relation) => [relation, publicGraph.edges.filter((edge) => edge.relation === relation).length])
    ),
    translationWarnings: qualityReport.translationConsistency.warnings
  });
  publicQualityReport.counts.hiddenPages = qualityReport.hiddenPages.count;
  publicQualityReport.hiddenPages = {
    count: qualityReport.hiddenPages.count,
    pages: [],
    redacted: true
  };

  const manifest = {
    schemaVersion: OKF_EXPORT_SCHEMA_VERSION,
    okfVersion: OKF_VERSION,
    profile: {
      id: OKF_PROFILE_ID,
      version: OKF_PROFILE_VERSION,
      base: 'Google Cloud Open Knowledge Format v0.1 draft'
    },
    name: 'Xinbaopedia public knowledge bundle',
    description: 'Public, agent-readable OKF export of Xinbao Qiao academic wiki content.',
    source: {
      directory: 'wiki',
      files: files.length,
      contentHash: sourceDigest,
      hashAlgorithm: 'sha256'
    },
    bundle: {
      root: 'public/okf',
      concepts: 'concepts/*.md',
      hiddenPagesExcluded: graph.stats.hiddenPages,
      publicPages: index.pages.length,
      sources: sourceRegistry.sources.length,
      sourceRegistry: 'sources.json'
    },
    maintenance: {
      command: 'npm run maintain:wiki',
      check: 'npm run lint:content',
      schema: 'schema.json',
      graph: 'graph.json',
      pages: 'pages.json',
      sources: 'sources.json',
      qualityReport: 'quality-report.json',
      reviewAsOf: REVIEW_AS_OF
    }
  };

  return {
    conceptFiles,
    graph: publicGraph,
    indexMarkdown: createOkfIndex(index),
    logMarkdown: createOkfLog(pages),
    manifest,
    pages: index,
    qualityReport: publicQualityReport,
    schema,
    sourceRegistry
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
  fs.writeFileSync(okfQualityReportPath, stableJson(okf.qualityReport));
  fs.writeFileSync(okfSchemaPath, stableJson(okf.schema));
  fs.writeFileSync(okfSourceRegistryPath, stableJson(okf.sourceRegistry));
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
  assertFresh(okfQualityReportPath, stableJson(okf.qualityReport));
  assertFresh(okfSchemaPath, stableJson(okf.schema));
  assertFresh(okfSourceRegistryPath, stableJson(okf.sourceRegistry));
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
const nextQualityReport = stableJson(result.qualityReport);
const nextSchema = stableJson(result.schema);
const nextSourceRegistry = stableJson(result.sourceRegistry);

if (write) {
  fs.writeFileSync(pageIndexPath, nextIndex);
  fs.writeFileSync(graphPath, nextGraph);
  fs.writeFileSync(qualityReportPath, nextQualityReport);
  fs.writeFileSync(schemaPath, nextSchema);
  fs.writeFileSync(sourceRegistryPath, nextSourceRegistry);
  writeOkfBundle(result.okf);
}

if (check) {
  assertFresh(pageIndexPath, nextIndex);
  assertFresh(graphPath, nextGraph);
  assertFresh(qualityReportPath, nextQualityReport);
  assertFresh(schemaPath, nextSchema);
  assertFresh(sourceRegistryPath, nextSourceRegistry);
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
    path: 'public/okf',
    qualityReport: 'public/okf/quality-report.json',
    sources: result.okf.sourceRegistry.sources.length
  },
  qualityReport: 'wiki/quality-report.json',
  sourceRegistry: {
    path: 'wiki/source-registry.json',
    sources: result.sourceRegistry.sources.length
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
