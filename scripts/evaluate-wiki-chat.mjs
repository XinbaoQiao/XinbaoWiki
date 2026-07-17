#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const MINIMUM_THRESHOLDS = Object.freeze({
  retrievalRecallAtK: 0.9,
  fullCaseRecallAtK: 0.85,
  evidencePatternRecall: 0.9,
  citationValidity: 1,
  answerabilityAccuracy: 1,
  abstentionAccuracy: 1,
  indexCoverage: 0.98,
  publicIndexPurity: 1,
  languagePurity: 1
});
const REQUIRED_HIGH_RISK_CASE_IDS = new Set([
  'en-abstain-unsupported-private',
  'en-abstain-out-of-domain',
  'en-abstain-history-isolation',
  'en-abstain-mixed-out-of-domain',
  'en-abstain-hidden-page',
  'zh-abstain-unsupported-private',
  'zh-abstain-out-of-domain',
  'zh-abstain-history-isolation',
  'zh-abstain-mixed-out-of-domain',
  'zh-abstain-hidden-page'
]);

function parseArguments(argv) {
  const options = {
    golden: path.join(PROJECT_ROOT, 'evals', 'wiki-chat-golden.json'),
    output: '',
    topK: null,
    noFail: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--golden') {
      options.golden = path.resolve(argv[++index] ?? '');
    } else if (argument === '--output') {
      options.output = path.resolve(argv[++index] ?? '');
    } else if (argument === '--top-k') {
      options.topK = Number(argv[++index]);
    } else if (argument === '--no-fail') {
      options.noFail = true;
    } else if (argument === '--help' || argument === '-h') {
      console.log([
        'Usage: node scripts/evaluate-wiki-chat.mjs [options]',
        '',
        'Options:',
        '  --golden PATH   Golden-set JSON (default: evals/wiki-chat-golden.json)',
        '  --output PATH   Write the machine-readable report to PATH',
        '  --top-k NUMBER  Override the golden-set retrieval depth',
        '  --no-fail       Emit failures without returning a non-zero exit code'
      ].join('\n'));
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (options.topK !== null && (!Number.isInteger(options.topK) || options.topK < 1 || options.topK > 50)) {
    throw new Error('--top-k must be an integer from 1 to 50.');
  }
  return options;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesLiteral(haystack, needle) {
  return normalizeText(haystack).includes(normalizeText(needle));
}

function ratio(numerator, denominator) {
  return denominator === 0 ? 1 : numerator / denominator;
}

function round(value) {
  return Number(value.toFixed(6));
}

function validateGolden(golden) {
  if (golden?.schemaVersion !== 1 || !Array.isArray(golden.cases) || golden.cases.length === 0) {
    throw new Error('Golden set must use schemaVersion 1 and contain at least one case.');
  }
  if (!golden.thresholds || typeof golden.thresholds !== 'object') {
    throw new Error('Golden set is missing thresholds.');
  }
  for (const [metric, minimum] of Object.entries(MINIMUM_THRESHOLDS)) {
    const configured = golden.thresholds[metric];
    if (!Number.isFinite(configured) || configured < minimum) {
      throw new Error(`Golden threshold ${metric} must be at least ${minimum}.`);
    }
  }

  const ids = new Set();
  for (const testCase of golden.cases) {
    if (!testCase.id || ids.has(testCase.id)) throw new Error(`Golden case has a missing or duplicate id: ${testCase.id}`);
    ids.add(testCase.id);
    if (!['en', 'zh'].includes(testCase.language)) throw new Error(`${testCase.id}: language must be en or zh.`);
    if (!testCase.query?.trim()) throw new Error(`${testCase.id}: query is required.`);
    if (testCase.priorUserMessages !== undefined && (
      !Array.isArray(testCase.priorUserMessages)
      || testCase.priorUserMessages.some((message) => typeof message !== 'string' || !message.trim())
    )) {
      throw new Error(`${testCase.id}: priorUserMessages must contain non-empty strings.`);
    }
    if (testCase.expectedAbstain) {
      if (!['no-evidence', 'no-retrieval'].includes(testCase.abstentionMode)) {
        throw new Error(`${testCase.id}: abstentionMode must be no-evidence or no-retrieval.`);
      }
    } else if (!Array.isArray(testCase.expectedSlugs) || testCase.expectedSlugs.length === 0) {
      throw new Error(`${testCase.id}: answerable cases require expectedSlugs.`);
    }
  }
  for (const id of REQUIRED_HIGH_RISK_CASE_IDS) {
    if (!ids.has(id)) throw new Error(`Golden set is missing required high-risk case ${id}.`);
  }
  for (const language of ['en', 'zh']) {
    const languageCases = golden.cases.filter((testCase) => testCase.language === language);
    if (languageCases.length < 10) throw new Error(`Golden set requires at least 10 ${language} cases.`);
    if (languageCases.filter((testCase) => testCase.category === 'multi-hop').length < 2) {
      throw new Error(`Golden set requires at least two ${language} multi-hop cases.`);
    }
  }
}

function sourceValidationIssues(source, publicPages, expectedLanguage, chunkById) {
  const issues = [];
  const page = publicPages.get(source?.slug);
  const indexedChunk = typeof source?.chunkId === 'string' ? chunkById.get(source.chunkId) : null;
  if (!page) issues.push('slug is not a public OKF page');
  if (page && page.language !== expectedLanguage) issues.push(`page language is ${page.language}, expected ${expectedLanguage}`);
  if (typeof source?.chunkId !== 'string' || !source.chunkId.startsWith(`${source?.slug}#`)) {
    issues.push('chunkId is not stable slug#section form');
  }
  const expectedHref = `/wiki/${encodeURIComponent(source?.slug ?? '')}/`;
  if (source?.href !== expectedHref) issues.push(`href is not ${expectedHref}`);
  if (typeof source?.title !== 'string' || !source.title.trim()) issues.push('title is missing');
  if (typeof source?.section !== 'string' || !source.section.trim()) issues.push('section is missing');
  if (!Number.isFinite(source?.score) || source.score < 0) issues.push('score is not a non-negative number');
  if (typeof source?.contentHash !== 'string' || !/^[a-f0-9]{64}$/i.test(source.contentHash)) {
    issues.push('contentHash is not a SHA-256 digest');
  }
  if (!indexedChunk) {
    issues.push('chunkId is absent from the production retrieval index');
  } else {
    for (const field of ['contentHash', 'slug', 'title', 'section', 'href']) {
      if (source?.[field] !== indexedChunk[field]) {
        issues.push(`${field} does not match the production retrieval index`);
      }
    }
    if (indexedChunk.language !== expectedLanguage) {
      issues.push(`indexed chunk language is ${indexedChunk.language}, expected ${expectedLanguage}`);
    }
  }
  return issues;
}

export function evaluateCase(testCase, retrieval, publicPages, chunkById) {
  const sources = Array.isArray(retrieval.sources) ? retrieval.sources : [];
  const contextChunkIds = [...String(retrieval.context || '').matchAll(/^CHUNK_ID: (.+)$/gm)].map((match) => match[1]);
  const retrievedSlugs = [...new Set(sources.map((source) => source.slug))];
  const expectedSlugs = testCase.expectedSlugs ?? [];
  const matchedSlugs = expectedSlugs.filter((slug) => retrievedSlugs.includes(slug));
  const evidencePatterns = testCase.evidencePatterns ?? [];
  const matchedEvidencePatterns = evidencePatterns.filter((pattern) => includesLiteral(retrieval.context, pattern));
  const unsupportedPatterns = testCase.unsupportedEvidencePatterns ?? [];
  const leakedUnsupportedPatterns = unsupportedPatterns.filter((pattern) => includesLiteral(retrieval.context, pattern));
  const sourceIssues = sources.flatMap((source, sourceIndex) =>
    sourceValidationIssues(source, publicPages, testCase.language, chunkById).map((issue) => ({
      sourceIndex,
      chunkId: source.chunkId ?? null,
      slug: source.slug ?? null,
      issue
    }))
  );
  for (const [sourceIndex, source] of sources.entries()) {
    if (!contextChunkIds.includes(source.chunkId)) {
      sourceIssues.push({ sourceIndex, chunkId: source.chunkId, slug: source.slug, issue: 'returned source is absent from injected context' });
    }
  }
  for (const chunkId of contextChunkIds) {
    if (!sources.some((source) => source.chunkId === chunkId)) {
      sourceIssues.push({ sourceIndex: null, chunkId, slug: null, issue: 'injected context chunk is absent from returned sources' });
    }
    if (!chunkById.has(chunkId)) {
      sourceIssues.push({ sourceIndex: null, chunkId, slug: null, issue: 'injected context chunk is absent from the production retrieval index' });
    }
  }
  const duplicateChunkIds = sources
    .map((source) => source.chunkId)
    .filter((chunkId, index, values) => values.indexOf(chunkId) !== index);
  for (const chunkId of [...new Set(duplicateChunkIds)]) {
    sourceIssues.push({ sourceIndex: null, chunkId, slug: null, issue: 'duplicate chunkId in retrieval result' });
  }

  let abstentionPassed = null;
  if (testCase.expectedAbstain) {
    const evidenceGatePassed = retrieval.shouldAbstain === true && leakedUnsupportedPatterns.length === 0;
    abstentionPassed = testCase.abstentionMode === 'no-retrieval'
      ? evidenceGatePassed && sources.length === 0
      : evidenceGatePassed;
  }

  return {
    id: testCase.id,
    language: testCase.language,
    category: testCase.category,
    query: testCase.query,
    priorUserMessages: testCase.priorUserMessages ?? [],
    expectedAbstain: testCase.expectedAbstain === true,
    shouldAbstain: retrieval.shouldAbstain === true,
    evidenceScore: retrieval.evidenceScore ?? null,
    queryCoverage: retrieval.queryCoverage ?? null,
    expectedSlugs,
    retrievedSlugs,
    matchedSlugs,
    expectedEvidencePatterns: evidencePatterns,
    matchedEvidencePatterns,
    leakedUnsupportedPatterns,
    abstentionMode: testCase.abstentionMode ?? null,
    abstentionPassed,
    sourceIssues,
    sources: sources.map((source) => ({
      chunkId: source.chunkId,
      contentHash: source.contentHash,
      slug: source.slug,
      title: source.title,
      section: source.section,
      href: source.href,
      score: source.score,
      matchedTerms: source.matchedTerms
    }))
  };
}

function thresholdFailures(metrics, thresholds) {
  return Object.entries(thresholds).flatMap(([metric, threshold]) => {
    const actual = metrics[metric];
    if (!Number.isFinite(threshold)) return [{ metric, actual: actual ?? null, threshold, reason: 'threshold is not numeric' }];
    if (!Number.isFinite(actual)) return [{ metric, actual: actual ?? null, threshold, reason: 'metric is missing' }];
    return actual + Number.EPSILON < threshold ? [{ metric, actual, threshold, reason: 'below threshold' }] : [];
  });
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const golden = await readJson(options.golden);
  validateGolden(golden);
  const topK = options.topK ?? golden.topK ?? 8;

  const retrieverPath = path.join(PROJECT_ROOT, 'lib', 'wiki-retrieval.ts');
  const retriever = await import(pathToFileURL(retrieverPath).href);
  if (typeof retriever.retrieveWikiContext !== 'function' || typeof retriever.getWikiRetrievalIndex !== 'function') {
    throw new Error('lib/wiki-retrieval.ts must export retrieveWikiContext() and getWikiRetrievalIndex().');
  }

  const publicPageData = await readJson(path.join(PROJECT_ROOT, 'public', 'okf', 'pages.json'));
  const publicPages = new Map(publicPageData.pages.map((page) => [page.slug, page]));
  const index = retriever.getWikiRetrievalIndex();
  if (!index || !Array.isArray(index.chunks)) throw new Error('getWikiRetrievalIndex() did not return a chunks array.');
  const chunkById = new Map(index.chunks.map((chunk) => [chunk.chunkId, chunk]));

  const indexedSlugs = new Set(index.chunks.map((chunk) => chunk.slug));
  const publicSlugs = [...publicPages.keys()];
  const missingPublicSlugs = publicSlugs.filter((slug) => !indexedSlugs.has(slug));
  const nonPublicIndexedSlugs = [...indexedSlugs].filter((slug) => !publicPages.has(slug));
  const cases = [];

  for (const testCase of golden.cases) {
    const retrieval = retriever.retrieveWikiContext(testCase.query, {
      language: testCase.language,
      limit: topK
    });
    cases.push(evaluateCase(testCase, retrieval, publicPages, chunkById));
  }

  const answerableCases = cases.filter((testCase) => !testCase.expectedAbstain);
  const abstentionCases = cases.filter((testCase) => testCase.expectedAbstain);
  const expectedSlugCount = answerableCases.reduce((sum, testCase) => sum + testCase.expectedSlugs.length, 0);
  const matchedSlugCount = answerableCases.reduce((sum, testCase) => sum + testCase.matchedSlugs.length, 0);
  const fullRecallCases = answerableCases.filter((testCase) => testCase.matchedSlugs.length === testCase.expectedSlugs.length);
  const evidencePatternCount = answerableCases.reduce((sum, testCase) => sum + testCase.expectedEvidencePatterns.length, 0);
  const matchedEvidencePatternCount = answerableCases.reduce((sum, testCase) => sum + testCase.matchedEvidencePatterns.length, 0);
  const retrievedSourceCount = cases.reduce((sum, testCase) => sum + testCase.sources.length, 0);
  const sourceBearingCases = cases.filter((testCase) => testCase.sources.length > 0 || testCase.sourceIssues.length > 0);
  const validCitationSets = sourceBearingCases.filter((testCase) => testCase.sourceIssues.length === 0);
  const languageSourceCount = cases.reduce(
    (sum, testCase) => sum + testCase.sources.filter((source) => publicPages.get(source.slug)?.language === testCase.language).length,
    0
  );

  const metrics = {
    retrievalRecallAtK: round(ratio(matchedSlugCount, expectedSlugCount)),
    fullCaseRecallAtK: round(ratio(fullRecallCases.length, answerableCases.length)),
    evidencePatternRecall: round(ratio(matchedEvidencePatternCount, evidencePatternCount)),
    citationValidity: round(ratio(validCitationSets.length, sourceBearingCases.length)),
    answerabilityAccuracy: round(ratio(answerableCases.filter((testCase) => !testCase.shouldAbstain).length, answerableCases.length)),
    abstentionAccuracy: round(ratio(abstentionCases.filter((testCase) => testCase.abstentionPassed).length, abstentionCases.length)),
    indexCoverage: round(ratio(publicSlugs.length - missingPublicSlugs.length, publicSlugs.length)),
    publicIndexPurity: nonPublicIndexedSlugs.length === 0 ? 1 : 0,
    languagePurity: round(ratio(languageSourceCount, retrievedSourceCount))
  };
  const failures = thresholdFailures(metrics, golden.thresholds);
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    evaluator: 'scripts/evaluate-wiki-chat.mjs',
    golden: {
      path: path.relative(PROJECT_ROOT, options.golden),
      name: golden.name,
      cases: cases.length,
      answerableCases: answerableCases.length,
      abstentionCases: abstentionCases.length,
      languages: {
        en: cases.filter((testCase) => testCase.language === 'en').length,
        zh: cases.filter((testCase) => testCase.language === 'zh').length
      },
      categories: Object.fromEntries(
        [...new Set(cases.map((testCase) => testCase.category))]
          .sort()
          .map((category) => [category, cases.filter((testCase) => testCase.category === category).length])
      )
    },
    retriever: {
      indexVersion: index.version ?? index.indexVersion ?? retriever.WIKI_RETRIEVAL_INDEX_VERSION ?? null,
      indexFingerprint: index.fingerprint ?? index.indexFingerprint ?? null,
      chunks: index.chunks.length,
      topK
    },
    indexCoverage: {
      publicPages: publicSlugs.length,
      indexedPublicPages: publicSlugs.length - missingPublicSlugs.length,
      missingPublicSlugs,
      nonPublicIndexedSlugs
    },
    thresholds: golden.thresholds,
    metrics,
    passed: failures.length === 0,
    failures,
    cases
  };

  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  if (options.output) {
    await fs.mkdir(path.dirname(options.output), { recursive: true });
    await fs.writeFile(options.output, serialized, 'utf8');
    console.log(`Wiki chat evaluation ${report.passed ? 'passed' : 'failed'}: ${path.relative(PROJECT_ROOT, options.output)}`);
    console.log(JSON.stringify(metrics));
  } else {
    process.stdout.write(serialized);
  }

  if (!report.passed && !options.noFail) process.exitCode = 1;
}

if (path.resolve(process.argv[1] || '') === SCRIPT_PATH) main().catch((error) => {
  console.error(`Wiki chat evaluation could not run: ${error.stack ?? error.message}`);
  process.exitCode = 1;
});
