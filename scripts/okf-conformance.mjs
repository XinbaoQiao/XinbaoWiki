import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import matter from 'gray-matter';

const root = process.cwd();
const wikiDir = path.join(root, 'wiki');
const okfDir = path.join(root, 'public', 'okf');
const conceptDir = path.join(okfDir, 'concepts');
const OKF_VERSION = '0.1';
const REQUIRED_FRONTMATTER = ['type', 'title', 'description', 'tags', 'timestamp'];
const RESERVED_OKF_FILES = ['index.md', 'log.md'];

const errors = [];

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
    JSON.stringify(docs.schema)
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

function assertQualityReport(quality, graph) {
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

const docs = {
  manifest: readJson('public/okf/manifest.json'),
  pages: readJson('public/okf/pages.json'),
  graph: readJson('public/okf/graph.json'),
  quality: readJson('public/okf/quality-report.json'),
  schema: readJson('public/okf/schema.json')
};

const docPaths = {
  manifest: 'public/okf/manifest.json',
  pages: 'public/okf/pages.json',
  graph: 'public/okf/graph.json',
  quality: 'public/okf/quality-report.json',
  schema: 'public/okf/schema.json'
};

for (const [name, value] of Object.entries(docs)) {
  assertSchemaDoc(docPaths[name], value);
}

const concepts = readConcepts();
const hidden = hiddenSlugs();

assertReservedOkfFiles();
assertPagesMatchConcepts(docs.pages, concepts);
assertPublicNodeReferences(docs.graph);
assertQualityReport(docs.quality, docs.graph);
assertStructuredRelationTargets(concepts);
assertHiddenPagesExcluded(hidden, docs, concepts);

if (errors.length > 0) {
  console.error(`OKF conformance failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`OKF conformance passed: ${concepts.size} concepts, ${hidden.size} hidden page(s) excluded.`);
