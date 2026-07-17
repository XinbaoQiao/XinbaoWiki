import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export type WikiRetrievalLanguage = 'en' | 'zh';

export type WikiRetrievalChunk = {
  chunkId: string;
  contentHash: string;
  slug: string;
  title: string;
  section: string;
  href: string;
  language: WikiRetrievalLanguage;
  summary: string;
  aliases: string[];
  tags: string[];
  content: string;
  outgoing: string[];
};

export type WikiRetrievalSource = {
  chunkId: string;
  contentHash: string;
  slug: string;
  title: string;
  section: string;
  href: string;
  score: number;
  matchedTerms: string[];
};

export type WikiRetrievalIndex = {
  algorithmVersion: string;
  indexVersion: string;
  indexFingerprint: string;
  chunks: WikiRetrievalChunk[];
  graph: Record<string, string[]>;
};

export type WikiRetrievalResult = {
  indexVersion: string;
  indexFingerprint: string;
  totalChunks: number;
  sources: WikiRetrievalSource[];
  context: string;
  evidenceScore: number;
  queryCoverage: number;
  shouldAbstain: boolean;
};

type RetrievalOptions = {
  language: WikiRetrievalLanguage;
  limit?: number;
  contextSlug?: string;
};

type PageRecord = {
  slug: string;
  title: string;
  summary: string;
  aliases: string[];
  tags: string[];
  language: WikiRetrievalLanguage;
  content: string;
  metadataText: string;
  outgoing: string[];
};

type PreparedChunk = {
  chunk: WikiRetrievalChunk;
  title: string;
  section: string;
  aliases: string;
  tags: string;
  summary: string;
  body: string;
  termSet: Set<string>;
};

type ScoredChunk = {
  prepared: PreparedChunk;
  score: number;
  matchedTerms: string[];
};

export const WIKI_RETRIEVAL_INDEX_VERSION = 'wiki-heading-lexical-v1';

const WIKI_DIR = path.join(process.cwd(), 'wiki');
const MAX_CHUNK_CHARACTERS = 1_800;
const DEFAULT_SOURCE_LIMIT = 6;
const MAX_SOURCE_LIMIT = 8;
const MAX_CONTEXT_CHARACTERS = 11_000;
const MIN_RETRIEVAL_SCORE = 2.2;

const ENGLISH_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'could', 'did', 'do', 'does',
  'for', 'from', 'had', 'has', 'have', 'he', 'her', 'his', 'how', 'i', 'in', 'is', 'it', 'its',
  'me', 'of', 'on', 'or', 'our', 'she', 'that', 'the', 'their', 'them', 'they', 'this', 'to', 'was',
  'should', 'we', 'were', 'what', 'when', 'where', 'which', 'who', 'why', 'will', 'with', 'would', 'you', 'your'
]);

const CHINESE_STOP_GRAMS = new Set([
  '一个', '一下', '以及', '关于', '可以', '如何', '我们', '什么', '他的', '他的', '这个', '那个',
  '哪些', '是否', '介绍', '一下', '目前', '还是', '怎么', '为什么'
]);
const CHINESE_STOP_CHARACTERS = new Set(['的', '了', '呢', '吗', '是', '有', '和', '与', '及', '在']);
const SENSITIVE_QUERY_PATTERN = /\b(?:passport|password|social security|ssn|bank account|credit card|home address|private address|phone number|mobile number|medical record|diagnosis|salary)\b|护照|身份证|密码|银行(?:卡|账户)|信用卡|家庭住址|私人住址|手机号|电话号码|医疗记录|病历|诊断|工资|薪水/iu;

let cachedIndex: WikiRetrievalIndex | null = null;
let cachedPrepared: { fingerprint: string; chunks: PreparedChunk[] } | null = null;
let cachedHiddenQueryPhrases: string[] | null = null;

function asStrings(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return [String(value)];
  if (Array.isArray(value)) return value.flatMap(asStrings);
  if (typeof value === 'object') return Object.values(value).flatMap(asStrings);
  return [];
}

function stringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())
    : [];
}

function titleFor(data: Record<string, unknown>, slug: string) {
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  return name || title || slug.replaceAll('_', ' ');
}

function summaryFor(data: Record<string, unknown>) {
  const summary = typeof data.summary === 'string' ? data.summary.trim() : '';
  const description = typeof data.description === 'string' ? data.description.trim() : '';
  return summary || description;
}

function languageForSlug(slug: string): WikiRetrievalLanguage {
  return slug === 'Qiao_Xinbao_zh' || slug.endsWith('_zh') ? 'zh' : 'en';
}

function normalizeText(value: string) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[\p{P}\p{S}\s]+/gu, ' ')
    .trim();
}

function markdownToText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1 ')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, label) => String(label || target).replaceAll('_', ' '))
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\$\$[\s\S]*?\$\$/g, ' formula ')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/^\[\^[^\]]+\]:.*$/gm, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_|~`\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function headingKey(value: string) {
  const normalized = normalizeText(markdownToText(value));
  return normalized
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'section';
}

function contentHash(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function normalizeLinkedSlug(target: string) {
  const withoutAnchor = target.split('#')[0]?.trim().replace(/\.md$/i, '').replace(/\s+/g, '_') || '';
  if (!withoutAnchor) return '';
  try {
    return decodeURIComponent(withoutAnchor);
  } catch {
    return withoutAnchor;
  }
}

function outgoingSlugs(content: string) {
  const links = new Set<string>();
  for (const match of content.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)) {
    const slug = normalizeLinkedSlug(match[1] || '');
    if (slug) links.add(slug);
  }
  for (const match of content.matchAll(/\[[^\]]+\]\(\/?wiki\/([^)/?#]+)[^)]*\)/g)) {
    const slug = normalizeLinkedSlug(match[1] || '');
    if (slug) links.add(slug);
  }
  return [...links].sort();
}

function selectedMetadata(data: Record<string, unknown>) {
  return asStrings({
    type: data.type,
    occupation: data.occupation,
    affiliation: data.affiliation,
    education: data.education,
    authors: data.authors,
    venue: data.venue,
    location: data.location,
    year: data.year,
    status: data.status,
    publicationType: data.publication_type,
    links: data.links
  }).join(' ');
}

function readPages() {
  if (!fs.existsSync(WIKI_DIR)) return [];
  return fs.readdirSync(WIKI_DIR)
    .filter((file) => file.endsWith('.md'))
    .sort()
    .flatMap((file): PageRecord[] => {
      const slug = file.replace(/\.md$/, '');
      const raw = fs.readFileSync(path.join(WIKI_DIR, file), 'utf8');
      const parsed = matter(raw);
      const data = parsed.data as Record<string, unknown>;
      if (data.hidden === true) return [];
      return [{
        slug,
        title: titleFor(data, slug),
        summary: summaryFor(data),
        aliases: stringList(data.aliases),
        tags: stringList(data.tags),
        language: languageForSlug(slug),
        content: parsed.content.trim(),
        metadataText: selectedMetadata(data),
        outgoing: outgoingSlugs(parsed.content)
      }];
    });
}

function hiddenQueryPhrases() {
  if (cachedHiddenQueryPhrases) return cachedHiddenQueryPhrases;
  if (!fs.existsSync(WIKI_DIR)) return [];

  const phrases = new Set<string>();
  for (const file of fs.readdirSync(WIKI_DIR).filter((entry) => entry.endsWith('.md')).sort()) {
    const slug = file.replace(/\.md$/, '');
    const parsed = matter(fs.readFileSync(path.join(WIKI_DIR, file), 'utf8'));
    const data = parsed.data as Record<string, unknown>;
    if (data.hidden !== true) continue;
    for (const value of [titleFor(data, slug), slug.replaceAll('_', ' '), ...stringList(data.aliases)]) {
      const phrase = normalizeText(value);
      if (phrase.length >= 4) phrases.add(phrase);
    }
  }
  cachedHiddenQueryPhrases = [...phrases].sort();
  return cachedHiddenQueryPhrases;
}

function targetsHiddenPage(query: string) {
  const normalizedQuery = normalizeText(query);
  return hiddenQueryPhrases().some((phrase) => normalizedQuery.includes(phrase));
}

function splitSections(content: string, language: WikiRetrievalLanguage) {
  const overview = language === 'zh' ? '概述' : 'Overview';
  const sections: Array<{ section: string; headingId: string; content: string }> = [];
  let currentSection = overview;
  let currentHeadingId = 'overview';
  let lines: string[] = [];
  let inFence = false;
  const duplicateHeadings = new Map<string, number>();

  function flush() {
    const sectionContent = lines.join('\n').trim();
    if (sectionContent) {
      sections.push({ section: currentSection, headingId: currentHeadingId, content: sectionContent });
      duplicateHeadings.set(currentHeadingId, Math.max(duplicateHeadings.get(currentHeadingId) || 0, 1));
    }
    lines = [];
  }

  for (const line of content.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    const heading = !inFence ? line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/) : null;
    if (!heading) {
      lines.push(line);
      continue;
    }
    flush();
    currentSection = markdownToText(heading[1] || '') || overview;
    const baseHeadingId = headingKey(currentSection);
    const duplicate = (duplicateHeadings.get(baseHeadingId) || 0) + 1;
    duplicateHeadings.set(baseHeadingId, duplicate);
    currentHeadingId = duplicate === 1 ? baseHeadingId : `${baseHeadingId}-${duplicate}`;
  }
  flush();
  return sections;
}

function splitLongContent(value: string) {
  const plain = markdownToText(value);
  if (plain.length <= MAX_CHUNK_CHARACTERS) return plain ? [plain] : [];

  const sentences = plain.split(/(?<=[。！？.!?])\s+|\s{2,}/u).filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences.length > 1 ? sentences : plain.match(new RegExp(`.{1,${MAX_CHUNK_CHARACTERS}}`, 'gu')) || []) {
    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length <= MAX_CHUNK_CHARACTERS) {
      current = next;
      continue;
    }
    if (current) chunks.push(current);
    current = sentence.slice(0, MAX_CHUNK_CHARACTERS);
    let remainder = sentence.slice(MAX_CHUNK_CHARACTERS);
    while (remainder.length > MAX_CHUNK_CHARACTERS) {
      chunks.push(remainder.slice(0, MAX_CHUNK_CHARACTERS));
      remainder = remainder.slice(MAX_CHUNK_CHARACTERS);
    }
    if (remainder) {
      chunks.push(current);
      current = remainder;
    }
  }
  if (current) chunks.push(current);
  return chunks.filter(Boolean);
}

function wikiHref(slug: string) {
  const pathname = `/wiki/${encodeURIComponent(slug)}/`;
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
  return basePath ? `${basePath}${pathname}` : pathname;
}

function chunksForPage(page: PageRecord) {
  const sections = splitSections(page.content, page.language);
  if (!sections.some((section) => section.headingId === 'overview') && (page.summary || page.metadataText)) {
    sections.unshift({ section: page.language === 'zh' ? '概述' : 'Overview', headingId: 'overview', content: '' });
  }

  return sections.flatMap((section): WikiRetrievalChunk[] => {
    const overviewPrefix = section.headingId === 'overview'
      ? [page.summary, page.metadataText].filter(Boolean).join(' ')
      : '';
    const content = [overviewPrefix, section.content].filter(Boolean).join(' ');
    return splitLongContent(content).map((part, index) => {
      const partSuffix = index === 0 ? '' : `--part-${index + 1}`;
      const chunkId = `${page.slug}#${section.headingId}${partSuffix}`;
      return {
        chunkId,
        contentHash: contentHash(`${chunkId}\n${part}`),
        slug: page.slug,
        title: page.title,
        section: section.section,
        href: wikiHref(page.slug),
        language: page.language,
        summary: page.summary,
        aliases: page.aliases,
        tags: page.tags,
        content: part,
        outgoing: page.outgoing
      };
    });
  });
}

function buildGraph(pages: PageRecord[]) {
  const existing = new Set(pages.map((page) => page.slug));
  const graph = new Map<string, Set<string>>(pages.map((page) => [page.slug, new Set<string>()]));
  for (const page of pages) {
    for (const target of page.outgoing) {
      const localizedTarget = page.language === 'zh'
        ? target === 'Xinbao_Qiao' && existing.has('Qiao_Xinbao_zh')
          ? 'Qiao_Xinbao_zh'
          : !target.endsWith('_zh') && existing.has(`${target}_zh`) ? `${target}_zh` : target
        : target === 'Qiao_Xinbao_zh' && existing.has('Xinbao_Qiao')
          ? 'Xinbao_Qiao'
          : target.endsWith('_zh') && existing.has(target.slice(0, -3)) ? target.slice(0, -3) : target;
      if (!existing.has(localizedTarget)) continue;
      graph.get(page.slug)?.add(localizedTarget);
      graph.get(localizedTarget)?.add(page.slug);
    }
  }
  return Object.fromEntries([...graph.entries()].map(([slug, neighbors]) => [slug, [...neighbors].sort()]));
}

export function getWikiRetrievalIndex(): WikiRetrievalIndex {
  if (cachedIndex) return cachedIndex;
  const pages = readPages();
  const chunks = pages.flatMap(chunksForPage);
  const hiddenBoundaryFingerprint = contentHash(hiddenQueryPhrases().join('\n'));
  const indexFingerprint = contentHash([
    ...chunks.map((chunk) => `${chunk.chunkId}:${chunk.contentHash}`),
    `hidden-boundary:${hiddenBoundaryFingerprint}`
  ].join('\n'));
  cachedIndex = {
    algorithmVersion: WIKI_RETRIEVAL_INDEX_VERSION,
    indexVersion: `${WIKI_RETRIEVAL_INDEX_VERSION}:${indexFingerprint.slice(0, 12)}`,
    indexFingerprint,
    chunks,
    graph: buildGraph(pages)
  };
  return cachedIndex;
}

function tokenizeWikiText(value: string, limit = Number.POSITIVE_INFINITY) {
  const normalized = normalizeText(value);
  const terms = new Set<string>();
  for (const token of normalized.match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) || []) {
    if (token.length > 1 && !ENGLISH_STOP_WORDS.has(token)) terms.add(token);
  }
  for (const run of normalized.match(/[\p{Script=Han}]+/gu) || []) {
    if (run.length <= 8 && !CHINESE_STOP_GRAMS.has(run)) terms.add(run);
    for (const width of [2, 3]) {
      for (let index = 0; index <= run.length - width; index += 1) {
        const gram = run.slice(index, index + width);
        if (!CHINESE_STOP_GRAMS.has(gram) && ![...gram].some((character) => CHINESE_STOP_CHARACTERS.has(character))) {
          terms.add(gram);
        }
      }
    }
  }
  return [...terms].slice(0, limit);
}

export function tokenizeWikiQuery(value: string) {
  return tokenizeWikiText(value, 32);
}

const IDENTITY_QUERY_TERMS = new Set(tokenizeWikiText('Xinbao Qiao Qiao Xinbao 乔鑫宝 鑫宝乔'));

function prepareChunks(index: WikiRetrievalIndex) {
  if (cachedPrepared?.fingerprint === index.indexFingerprint) return cachedPrepared.chunks;
  const chunks = index.chunks.map((chunk): PreparedChunk => {
    const title = normalizeText(chunk.title);
    const section = normalizeText(chunk.section);
    const aliases = normalizeText(chunk.aliases.join(' '));
    const tags = normalizeText(chunk.tags.join(' '));
    const summary = normalizeText(chunk.summary);
    const body = normalizeText(chunk.content);
    return {
      chunk,
      title,
      section,
      aliases,
      tags,
      summary,
      body,
      termSet: new Set(tokenizeWikiText([title, section, aliases, tags, summary, body].join(' ')))
    };
  });
  cachedPrepared = { fingerprint: index.indexFingerprint, chunks };
  return chunks;
}

function phraseScore(query: string, chunk: PreparedChunk) {
  if (query.length < 2 || query.length > 100) return 0;
  if (chunk.title === query) return 30;
  if (chunk.title.includes(query)) return 18;
  if (chunk.aliases.includes(query)) return 15;
  if (chunk.section.includes(query)) return 11;
  if (chunk.tags.includes(query)) return 8;
  if (chunk.summary.includes(query)) return 7;
  if (chunk.body.includes(query)) return 4;
  return 0;
}

function fieldTermScore(field: string, term: string, weight: number) {
  const matches = /^[a-z0-9-]+$/.test(term)
    ? ` ${field} `.includes(` ${term} `)
    : field.includes(term);
  return matches ? weight : 0;
}

function scoreChunks(index: WikiRetrievalIndex, query: string, language: WikiRetrievalLanguage, contextSlug = '') {
  const prepared = prepareChunks(index).filter((item) => item.chunk.language === language);
  const terms = tokenizeWikiQuery(query);
  const normalizedQuery = normalizeText(query);
  const documentFrequency = new Map<string, number>();
  for (const term of terms) {
    documentFrequency.set(term, prepared.reduce((count, chunk) => count + Number(chunk.termSet.has(term)), 0));
  }

  const scored = prepared.map((item): ScoredChunk => {
    let score = phraseScore(normalizedQuery, item);
    const matchedTerms: string[] = [];
    for (const term of terms) {
      const frequency = documentFrequency.get(term) || 0;
      const inverseFrequency = Math.log((prepared.length + 1) / (frequency + 1)) + 1;
      const termScore =
        fieldTermScore(item.title, term, 8) +
        fieldTermScore(item.aliases, term, 6) +
        fieldTermScore(item.tags, term, 4.5) +
        fieldTermScore(item.section, term, 4) +
        fieldTermScore(item.summary, term, 2.5) +
        fieldTermScore(item.body, term, 1);
      if (termScore > 0) {
        matchedTerms.push(term);
        score += termScore * inverseFrequency;
      }
    }
    if (contextSlug && item.chunk.slug === contextSlug && score > 0) score += 2;
    return { prepared: item, score, matchedTerms };
  });

  const leadingSlugs = new Set(scored
    .filter((item) => item.score >= MIN_RETRIEVAL_SCORE)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((item) => item.prepared.chunk.slug));
  const neighborSlugs = new Set([...leadingSlugs].flatMap((slug) => index.graph[slug] || []));

  for (const item of scored) {
    if (item.score > 0 && neighborSlugs.has(item.prepared.chunk.slug) && !leadingSlugs.has(item.prepared.chunk.slug)) {
      item.score += 1.25;
    }
  }
  return { scored, terms };
}

function selectSources(scored: ScoredChunk[], limit: number, fallbackSlug = '') {
  const selected: ScoredChunk[] = [];
  const perPage = new Map<string, number>();
  const ranked = scored
    .filter((item) => item.score >= MIN_RETRIEVAL_SCORE)
    .sort((left, right) => right.score - left.score || left.prepared.chunk.chunkId.localeCompare(right.prepared.chunk.chunkId));

  for (const item of ranked) {
    const seen = perPage.get(item.prepared.chunk.slug) || 0;
    if (seen >= 2) continue;
    selected.push(item);
    perPage.set(item.prepared.chunk.slug, seen + 1);
    if (selected.length >= limit) break;
  }

  if (selected.length === 0 && fallbackSlug) {
    const fallback = scored.find((item) => item.prepared.chunk.slug === fallbackSlug && item.prepared.chunk.chunkId.endsWith('#overview'))
      || scored.find((item) => item.prepared.chunk.slug === fallbackSlug);
    if (fallback) selected.push(fallback);
  }
  return selected;
}

function contextForSources(sources: ScoredChunk[]) {
  let context = '';
  const included: ScoredChunk[] = [];
  for (const [index, item] of sources.entries()) {
    const chunk = item.prepared.chunk;
    const block = [
      `[SOURCE ${index + 1}]`,
      `CHUNK_ID: ${chunk.chunkId}`,
      `PAGE: ${chunk.title}`,
      `SECTION: ${chunk.section}`,
      `URL: ${chunk.href}`,
      `CONTENT: ${chunk.content}`
    ].join('\n');
    const next = context ? `${context}\n\n${block}` : block;
    if (next.length > MAX_CONTEXT_CHARACTERS) break;
    context = next;
    included.push(item);
  }
  return {
    context: context || 'No relevant local wiki evidence was retrieved.',
    sources: included
  };
}

export function retrieveWikiContext(query: string, options: RetrievalOptions): WikiRetrievalResult {
  const index = getWikiRetrievalIndex();
  if (targetsHiddenPage(query)) {
    return {
      indexVersion: index.indexVersion,
      indexFingerprint: index.indexFingerprint,
      totalChunks: index.chunks.length,
      sources: [],
      context: 'No relevant local wiki evidence was retrieved.',
      evidenceScore: 0,
      queryCoverage: 0,
      shouldAbstain: true
    };
  }
  const limit = Math.max(1, Math.min(MAX_SOURCE_LIMIT, options.limit || DEFAULT_SOURCE_LIMIT));
  const { scored, terms } = scoreChunks(index, query, options.language, options.contextSlug);
  const selected = selectSources(scored, limit, options.contextSlug);
  const matched = new Set(selected.flatMap((item) => item.matchedTerms));
  const substantiveTerms = terms.filter((term) => !IDENTITY_QUERY_TERMS.has(term));
  const matchedSubstantiveTerms = substantiveTerms.filter((term) => matched.has(term));
  const queryCoverage = terms.length > 0 ? matched.size / terms.length : 0;
  const topScore = selected[0]?.score || 0;
  const evidenceScore = Math.min(1, queryCoverage * 0.65 + Math.min(1, topScore / 24) * 0.35);
  const sensitiveQuery = SENSITIVE_QUERY_PATTERN.test(normalizeText(query));
  const identityOnlyEvidence = substantiveTerms.length > 0 && matchedSubstantiveTerms.length === 0;
  const weakEvidence = identityOnlyEvidence || evidenceScore < 0.35 || (queryCoverage < 0.18 && evidenceScore < 0.5);
  const shouldAbstain = selected.length === 0 || sensitiveQuery || weakEvidence;
  const groundedSelection = shouldAbstain ? [] : selected;
  const packed = contextForSources(groundedSelection);

  return {
    indexVersion: index.indexVersion,
    indexFingerprint: index.indexFingerprint,
    totalChunks: index.chunks.length,
    sources: packed.sources.map(({ prepared, score, matchedTerms }) => ({
      chunkId: prepared.chunk.chunkId,
      contentHash: prepared.chunk.contentHash,
      slug: prepared.chunk.slug,
      title: prepared.chunk.title,
      section: prepared.chunk.section,
      href: prepared.chunk.href,
      score: Number(score.toFixed(3)),
      matchedTerms: matchedTerms.slice(0, 8)
    })),
    context: packed.context,
    evidenceScore: Number(evidenceScore.toFixed(3)),
    queryCoverage: Number(queryCoverage.toFixed(3)),
    shouldAbstain
  };
}

export function clearWikiRetrievalCache() {
  cachedIndex = null;
  cachedPrepared = null;
  cachedHiddenQueryPhrases = null;
}
