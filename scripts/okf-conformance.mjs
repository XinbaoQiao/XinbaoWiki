import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import matter from 'gray-matter';

const root = process.cwd();
const wikiDir = path.join(root, 'wiki');
const okfDir = path.join(root, 'public', 'okf');
const conceptDir = path.join(okfDir, 'concepts');
const OKF_VERSION = '0.1';
const OKF_PROFILE_ID = 'xinbaopedia-okf-profile';
const HASH_PREFIX = 'sha256:';
const REQUIRED_FRONTMATTER = ['type', 'title', 'description', 'tags', 'timestamp'];
const RESERVED_OKF_FILES = ['index.md', 'log.md'];
const EXPECTED_SCHEMA_VERSIONS = {
  manifest: 3,
  pages: 4,
  graph: 4,
  quality: 2,
  schema: 5,
  sources: 1
};

const errors = [];

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

function expectedSourceId(url) {
  return `src-${hashString(url).slice(HASH_PREFIX.length, HASH_PREFIX.length + 16)}`;
}

function report(message) {
  errors.push(message);
}

function readText(relativePath) {
  const filePath = path.join(root, relativePath);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    report(`${relativePath}: cannot read file (${error.message})`);
    return null;
  }
}

function readJson(relativePath) {
  const text = readText(relativePath);
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    report(`${relativePath}: invalid JSON (${error.message})`);
    return null;
  }
}

function assertSchemaDoc(relativePath, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    report(`${relativePath}: expected a JSON object`);
    return;
  }
  if (value.okfVersion !== OKF_VERSION) {
    report(`${relativePath}: expected okfVersion ${OKF_VERSION}, got ${JSON.stringify(value.okfVersion)}`);
  }
  if (!Number.isInteger(value.schemaVersion) || value.schemaVersion <= 0) {
    report(`${relativePath}: expected positive integer schemaVersion`);
  }
}

function assertProfile(relativePath, value) {
  if (!value || typeof value !== 'object') return;
  if (!value.profile || value.profile.id !== OKF_PROFILE_ID || typeof value.profile.version !== 'string') {
    report(`${relativePath}: missing ${OKF_PROFILE_ID} profile declaration`);
  }
}

function assertSourceRegistry(registry, concepts) {
  if (!registry || typeof registry !== 'object') return;
  if (!Array.isArray(registry.sources)) {
    report('public/okf/sources.json: sources must be an array');
    return;
  }
  if (registry.contentHash !== hashString(JSON.stringify(sortForHash(registry.sources)))) {
    report('public/okf/sources.json: contentHash does not match canonical source entries');
  }
  if (!registry.checkPolicy || !Array.isArray(registry.checkPolicy.allowedStatuses)) {
    report('public/okf/sources.json: checkPolicy.allowedStatuses must be an array');
  }

  const sourceMap = new Map();
  for (const source of registry.sources) {
    if (!source || typeof source !== 'object') {
      report('public/okf/sources.json: every source must be an object');
      continue;
    }
    if (typeof source.url !== 'string' || !/^https?:\/\//.test(source.url)) {
      report(`public/okf/sources.json: source ${source.id || '(missing id)'} must use an http(s) URL`);
      continue;
    }
    const expectedId = expectedSourceId(source.url);
    if (source.id !== expectedId) {
      report(`public/okf/sources.json: source id ${source.id} does not match canonical URL identity ${expectedId}`);
    }
    if (sourceMap.has(source.id)) report(`public/okf/sources.json: duplicate source id ${source.id}`);
    sourceMap.set(source.id, source);
    if (source.hash?.algorithm !== 'sha256' || source.hash?.scope !== 'canonical-url' || source.hash?.value !== hashString(source.url)) {
      report(`public/okf/sources.json: source ${source.id} has an invalid canonical URL hash`);
    }
    if (
      !source.check ||
      typeof source.check.method !== 'string' ||
      !registry.checkPolicy?.allowedStatuses?.includes(source.check.status) ||
      !Number.isInteger(source.check.maxAgeDays) ||
      source.check.maxAgeDays <= 0
    ) {
      report(`public/okf/sources.json: source ${source.id} has an invalid check contract`);
    }
    if (!Array.isArray(source.pages) || !Array.isArray(source.evidence)) {
      report(`public/okf/sources.json: source ${source.id} must declare pages and evidence arrays`);
      continue;
    }
    for (const slug of source.pages) {
      if (!concepts.has(slug)) report(`public/okf/sources.json: source ${source.id} references non-public page ${slug}`);
    }
    const evidenceSlugs = new Set(source.evidence.map((item) => item && item.slug));
    for (const slug of source.pages) {
      if (!evidenceSlugs.has(slug)) report(`public/okf/sources.json: source ${source.id} lacks evidence for page ${slug}`);
    }
  }
  return sourceMap;
}

function slugFromFileName(fileName) {
  return fileName.replace(/\.md$/, '');
}

function hasRequiredFrontmatter(fileName, data) {
  for (const field of REQUIRED_FRONTMATTER) {
    if (!(field in data)) {
      report(`public/okf/concepts/${fileName}: missing frontmatter field ${field}`);
    }
  }
  if (typeof data.type !== 'string' || !data.type.trim()) {
    report(`public/okf/concepts/${fileName}: type must be a non-empty string`);
  }
  if (typeof data.title !== 'string' || !data.title.trim()) {
    report(`public/okf/concepts/${fileName}: title must be a non-empty string`);
  }
  if (typeof data.description !== 'string' || !data.description.trim()) {
    report(`public/okf/concepts/${fileName}: description must be a non-empty string`);
  }
  if (!Array.isArray(data.tags) || data.tags.length === 0 || data.tags.some((tag) => typeof tag !== 'string' || !tag.trim())) {
    report(`public/okf/concepts/${fileName}: tags must be a non-empty string array`);
  }
  if (typeof data.timestamp !== 'string' || !data.timestamp.trim()) {
    report(`public/okf/concepts/${fileName}: timestamp must be a non-empty string`);
  }
  for (const field of ['modified', 'reviewed_at', 'review_due']) {
    if (typeof data[field] !== 'string' || Number.isNaN(Date.parse(data[field]))) {
      report(`public/okf/concepts/${fileName}: ${field} must be a valid date or timestamp`);
    }
  }
  if (typeof data.content_hash !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(data.content_hash)) {
    report(`public/okf/concepts/${fileName}: content_hash must be a SHA-256 digest`);
  }
  if (!Array.isArray(data.source_ids) || data.source_ids.some((id) => typeof id !== 'string')) {
    report(`public/okf/concepts/${fileName}: source_ids must be an array of strings`);
  }
  if (data.retrieval?.document_id !== `wiki:${slugFromFileName(fileName)}` || data.retrieval?.chunking !== 'markdown-heading-v1') {
    report(`public/okf/concepts/${fileName}: retrieval metadata must use the stable wiki:<slug> contract`);
  }
}

function readConcepts() {
  let fileNames = [];
  try {
    fileNames = fs.readdirSync(conceptDir).filter((file) => file.endsWith('.md')).sort();
  } catch (error) {
    report(`public/okf/concepts: cannot read directory (${error.message})`);
    return new Map();
  }

  const concepts = new Map();
  for (const fileName of fileNames) {
    const relativePath = `public/okf/concepts/${fileName}`;
    const raw = readText(relativePath);
    if (raw === null) continue;
    let parsed;
    try {
      parsed = matter(raw);
    } catch (error) {
      report(`${relativePath}: invalid frontmatter (${error.message})`);
      continue;
    }
    const slug = slugFromFileName(fileName);
    concepts.set(slug, { fileName, data: parsed.data, content: parsed.content });
    hasRequiredFrontmatter(fileName, parsed.data);
    if (parsed.data.source_path && parsed.data.source_path !== `wiki/${fileName}`) {
      report(`${relativePath}: source_path should be wiki/${fileName}`);
    }
  }
  return concepts;
}

function hiddenSlugs() {
  const slugs = new Set();
  let fileNames = [];
  try {
    fileNames = fs.readdirSync(wikiDir).filter((file) => file.endsWith('.md')).sort();
  } catch (error) {
    report(`wiki: cannot read directory (${error.message})`);
    return slugs;
  }

  for (const fileName of fileNames) {
    const raw = readText(`wiki/${fileName}`);
    if (raw === null) continue;
    try {
      const parsed = matter(raw);
      if (parsed.data.hidden === true) slugs.add(slugFromFileName(fileName));
    } catch (error) {
      report(`wiki/${fileName}: invalid frontmatter (${error.message})`);
    }
  }
  return slugs;
}

function assertReservedOkfFiles() {
  for (const fileName of RESERVED_OKF_FILES) {
    const relativePath = `public/okf/${fileName}`;
    const raw = readText(relativePath);
    if (raw === null) continue;
    if (/^---\s*$/m.test(raw)) {
      report(`${relativePath}: reserved OKF entry file must not contain YAML frontmatter`);
    }
  }
}

function assertPublicNodeReferences(graph) {
  if (!graph || typeof graph !== 'object') return;
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : null;
  const edges = Array.isArray(graph.edges) ? graph.edges : null;
  if (!nodes) {
    report('public/okf/graph.json: nodes must be an array');
    return;
  }
  if (!edges) {
    report('public/okf/graph.json: edges must be an array');
    return;
  }

  const publicSlugs = new Set(nodes.map((node) => node && node.slug).filter((slug) => typeof slug === 'string'));
  for (const node of nodes) {
    if (!node || typeof node.slug !== 'string') {
      report('public/okf/graph.json: every node must have a slug');
      continue;
    }
    for (const field of ['outgoing', 'backlinks']) {
      if (!Array.isArray(node[field])) {
        report(`public/okf/graph.json: node ${node.slug} ${field} must be an array`);
        continue;
      }
      for (const target of node[field]) {
        if (!publicSlugs.has(target)) {
          report(`public/okf/graph.json: node ${node.slug} ${field} points outside public graph: ${target}`);
        }
      }
    }
  }

  for (const edge of edges) {
    if (!edge || typeof edge.from !== 'string' || typeof edge.to !== 'string') {
      report('public/okf/graph.json: every edge must have string from/to values');
      continue;
    }
    if (!publicSlugs.has(edge.from)) {
      report(`public/okf/graph.json: edge starts outside public graph: ${edge.from} -> ${edge.to}`);
    }
    if (!publicSlugs.has(edge.to)) {
      report(`public/okf/graph.json: edge ends outside public graph: ${edge.from} -> ${edge.to}`);
    }
  }
}

function assertStructuredRelationTargets(concepts) {
  const conceptSlugs = new Set(concepts.keys());
  for (const { fileName, data } of concepts.values()) {
    if (!('relations' in data)) continue;
    if (!Array.isArray(data.relations)) {
      report(`public/okf/concepts/${fileName}: relations must be an array when present`);
      continue;
    }
    for (const relation of data.relations) {
      if (!relation || typeof relation !== 'object' || Array.isArray(relation)) {
        report(`public/okf/concepts/${fileName}: relation entries must be objects`);
        continue;
      }
      if (typeof relation.type !== 'string' || !relation.type.trim()) {
        report(`public/okf/concepts/${fileName}: structured relation missing type`);
      }
      if (typeof relation.target !== 'string' || !relation.target.trim()) {
        report(`public/okf/concepts/${fileName}: structured relation missing target`);
        continue;
      }
      if (!conceptSlugs.has(relation.target)) {
        report(`public/okf/concepts/${fileName}: structured relation target does not exist: ${relation.target}`);
      }
    }
  }
}

function assertHiddenPagesExcluded(hidden, docs, concepts) {
  const publicText = [
    JSON.stringify(docs.manifest),
    JSON.stringify(docs.pages),
    JSON.stringify(docs.graph),
    JSON.stringify(docs.quality),
    JSON.stringify(docs.schema),
    JSON.stringify(docs.sources)
  ].join('\n');

  for (const slug of hidden) {
    if (concepts.has(slug)) {
      report(`public/okf/concepts/${slug}.md: hidden page must not be exported`);
    }
    if (publicText.includes(slug)) {
      report(`public/okf JSON bundle: hidden slug leaked into public export: ${slug}`);
    }
  }
}

function assertQualityReport(quality, graph, sources) {
  if (!quality || typeof quality !== 'object') return;
  if (!quality.counts || typeof quality.counts !== 'object') {
    report('public/okf/quality-report.json: missing counts object');
    return;
  }
  if (graph && Array.isArray(graph.nodes) && quality.counts.pages !== graph.nodes.length) {
    report(`public/okf/quality-report.json: counts.pages ${quality.counts.pages} does not match public graph node count ${graph.nodes.length}`);
  }
  if (quality.counts.warnings !== 0) {
    report(`public/okf/quality-report.json: expected zero warnings, got ${JSON.stringify(quality.counts.warnings)}`);
  }
  if (!Array.isArray(quality.warnings) || quality.warnings.length !== 0) {
    report('public/okf/quality-report.json: warnings must be an empty array');
  }
  if (!quality.hiddenPages || !Array.isArray(quality.hiddenPages.pages)) {
    report('public/okf/quality-report.json: missing hiddenPages.pages array');
  } else if (quality.hiddenPages.pages.length !== 0) {
    report('public/okf/quality-report.json: hiddenPages.pages must not expose hidden source slugs');
  }
  if (!Array.isArray(quality.missingTranslationPairs)) {
    report('public/okf/quality-report.json: missingTranslationPairs must be an array');
  }
  if (!quality.structuredRelationCounts || typeof quality.structuredRelationCounts !== 'object') {
    report('public/okf/quality-report.json: structuredRelationCounts must be an object');
  }
  for (const field of ['sourceCoverage', 'citationCoverage', 'reviewFreshness', 'typedRelationCoverage', 'retrievalReadiness']) {
    if (!quality[field] || typeof quality[field] !== 'object') {
      report(`public/okf/quality-report.json: ${field} must be an object`);
    }
  }
  if (quality.sourceCoverage?.pages !== graph?.nodes?.length) {
    report('public/okf/quality-report.json: sourceCoverage.pages must match public graph nodes');
  }
  if (quality.sourceCoverage?.registeredSources !== sources?.sources?.length) {
    report('public/okf/quality-report.json: sourceCoverage.registeredSources must match sources.json');
  }
  if (!Array.isArray(quality.reviewFreshness?.pendingReviewPages) || quality.reviewFreshness.pendingReviewPages.length !== 0) {
    report('public/okf/quality-report.json: pendingReviewPages must be empty for a conforming bundle');
  }
  if (!Array.isArray(quality.reviewFreshness?.overduePages) || quality.reviewFreshness.overduePages.length !== 0) {
    report('public/okf/quality-report.json: overduePages must be empty for a conforming bundle');
  }
  if (
    quality.retrievalReadiness?.readyPages !== graph?.nodes?.length ||
    quality.retrievalReadiness?.coverage !== 1 ||
    !Array.isArray(quality.retrievalReadiness?.missingMetadataPages) ||
    quality.retrievalReadiness.missingMetadataPages.length !== 0
  ) {
    report('public/okf/quality-report.json: every public page must be retrieval-ready');
  }
}

function assertPagesMatchConcepts(pages, concepts) {
  const pageList = pages && Array.isArray(pages.pages) ? pages.pages : null;
  if (!pageList) {
    report('public/okf/pages.json: pages must be an array');
    return;
  }
  const pageSlugs = new Set();
  for (const page of pageList) {
    if (!page || typeof page.slug !== 'string') {
      report('public/okf/pages.json: every page must have a slug');
      continue;
    }
    pageSlugs.add(page.slug);
    for (const field of REQUIRED_FRONTMATTER) {
      const pageField = field === 'description' ? 'summary' : field;
      if (!(pageField in page)) {
        report(`public/okf/pages.json: page ${page.slug} missing ${pageField}`);
      }
    }
  }
  for (const slug of pageSlugs) {
    if (!concepts.has(slug)) {
      report(`public/okf/pages.json: page ${slug} has no matching public concept`);
    }
  }
  for (const slug of concepts.keys()) {
    if (!pageSlugs.has(slug)) {
      report(`public/okf/concepts/${slug}.md: concept has no matching public page index entry`);
    }
  }
}

function assertProvenanceMetadata(pages, graph, concepts, sourceMap) {
  const pageList = pages && Array.isArray(pages.pages) ? pages.pages : [];
  const nodeMap = new Map(
    graph && Array.isArray(graph.nodes)
      ? graph.nodes.filter((node) => node && typeof node.slug === 'string').map((node) => [node.slug, node])
      : []
  );
  for (const page of pageList) {
    if (!page || typeof page.slug !== 'string') continue;
    if (typeof page.contentHash !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(page.contentHash)) {
      report(`public/okf/pages.json: page ${page.slug} has an invalid contentHash`);
    }
    for (const field of ['modifiedAt', 'reviewedAt', 'reviewDue']) {
      if (typeof page[field] !== 'string' || Number.isNaN(Date.parse(page[field]))) {
        report(`public/okf/pages.json: page ${page.slug} has an invalid ${field}`);
      }
    }
    if (!Array.isArray(page.sourceIds) || !Array.isArray(page.citationSourceIds) || !Array.isArray(page.footnoteSourceIds)) {
      report(`public/okf/pages.json: page ${page.slug} must expose source ID arrays`);
      continue;
    }
    for (const id of page.sourceIds) {
      if (!sourceMap?.has(id)) report(`public/okf/pages.json: page ${page.slug} references unknown source ${id}`);
    }
    if (page.retrieval?.documentId !== `wiki:${page.slug}` || page.retrieval?.contentHash !== page.contentHash) {
      report(`public/okf/pages.json: page ${page.slug} has inconsistent retrieval metadata`);
    }

    const concept = concepts.get(page.slug);
    if (concept) {
      if (concept.data.content_hash !== page.contentHash) {
        report(`public/okf/concepts/${page.slug}.md: content_hash does not match pages.json`);
      }
      if (JSON.stringify(concept.data.source_ids || []) !== JSON.stringify(page.sourceIds)) {
        report(`public/okf/concepts/${page.slug}.md: source_ids do not match pages.json`);
      }
      if (
        concept.data.modified !== page.modifiedAt ||
        concept.data.reviewed_at !== page.reviewedAt ||
        concept.data.review_due !== page.reviewDue
      ) {
        report(`public/okf/concepts/${page.slug}.md: review lifecycle does not match pages.json`);
      }
    }

    const node = nodeMap.get(page.slug);
    if (!node) continue;
    if (
      node.contentHash !== page.contentHash ||
      node.modifiedAt !== page.modifiedAt ||
      node.reviewedAt !== page.reviewedAt ||
      node.reviewDue !== page.reviewDue ||
      JSON.stringify(node.sourceIds || []) !== JSON.stringify(page.sourceIds)
    ) {
      report(`public/okf/graph.json: node ${page.slug} provenance does not match pages.json`);
    }
  }

  for (const [id, source] of sourceMap || []) {
    for (const slug of source.pages) {
      const page = pageList.find((item) => item.slug === slug);
      if (page && !page.sourceIds.includes(id)) {
        report(`public/okf/sources.json: source ${id} page association is missing from pages.json entry ${slug}`);
      }
    }
  }
}

const docs = {
  manifest: readJson('public/okf/manifest.json'),
  pages: readJson('public/okf/pages.json'),
  graph: readJson('public/okf/graph.json'),
  quality: readJson('public/okf/quality-report.json'),
  schema: readJson('public/okf/schema.json'),
  sources: readJson('public/okf/sources.json')
};

const docPaths = {
  manifest: 'public/okf/manifest.json',
  pages: 'public/okf/pages.json',
  graph: 'public/okf/graph.json',
  quality: 'public/okf/quality-report.json',
  schema: 'public/okf/schema.json',
  sources: 'public/okf/sources.json'
};

for (const [name, value] of Object.entries(docs)) {
  assertSchemaDoc(docPaths[name], value);
  if (value && value.schemaVersion !== EXPECTED_SCHEMA_VERSIONS[name]) {
    report(`${docPaths[name]}: expected schemaVersion ${EXPECTED_SCHEMA_VERSIONS[name]}, got ${JSON.stringify(value.schemaVersion)}`);
  }
}

const concepts = readConcepts();
const hidden = hiddenSlugs();
const sourceMap = assertSourceRegistry(docs.sources, concepts);

assertProfile('public/okf/manifest.json', docs.manifest);
assertProfile('public/okf/schema.json', docs.schema);
assertProfile('public/okf/sources.json', docs.sources);
assertReservedOkfFiles();
assertPagesMatchConcepts(docs.pages, concepts);
assertPublicNodeReferences(docs.graph);
assertQualityReport(docs.quality, docs.graph, docs.sources);
assertStructuredRelationTargets(concepts);
assertHiddenPagesExcluded(hidden, docs, concepts);
assertProvenanceMetadata(docs.pages, docs.graph, concepts, sourceMap);

if (docs.manifest?.bundle?.sourceRegistry !== 'sources.json' || docs.manifest?.bundle?.sources !== docs.sources?.sources?.length) {
  report('public/okf/manifest.json: source registry metadata does not match sources.json');
}

if (errors.length > 0) {
  console.error(`OKF conformance failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`OKF v0.1 + Xinbaopedia profile conformance passed: ${concepts.size} concepts, ${sourceMap?.size || 0} sources, ${hidden.size} hidden page(s) excluded.`);
