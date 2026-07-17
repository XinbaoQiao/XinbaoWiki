#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_CONCURRENCY = 8;

function parseArguments(argv) {
  const options = {
    checkLinks: false,
    strictIndeterminate: false,
    noFail: false,
    output: '',
    timeoutMs: DEFAULT_TIMEOUT_MS,
    concurrency: DEFAULT_CONCURRENCY
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--check-links') options.checkLinks = true;
    else if (argument === '--strict-indeterminate') options.strictIndeterminate = true;
    else if (argument === '--no-fail') options.noFail = true;
    else if (argument === '--output') options.output = path.resolve(argv[++index] ?? '');
    else if (argument === '--timeout-ms') options.timeoutMs = Number(argv[++index]);
    else if (argument === '--concurrency') options.concurrency = Number(argv[++index]);
    else if (argument === '--help' || argument === '-h') {
      console.log([
        'Usage: node scripts/audit-wiki-maintenance.mjs [options]',
        '',
        'Options:',
        '  --check-links            Check all registered and wiki http(s) links',
        '  --strict-indeterminate   Fail on blocked, rate-limited, timed-out, or 5xx links',
        '  --output PATH            Write a machine-readable JSON report',
        `  --timeout-ms NUMBER      Per-request timeout (default: ${DEFAULT_TIMEOUT_MS})`,
        `  --concurrency NUMBER     Link-check workers (default: ${DEFAULT_CONCURRENCY})`,
        '  --no-fail                Emit failures without returning a non-zero exit code'
      ].join('\n'));
      process.exit(0);
    } else throw new Error(`Unknown argument: ${argument}`);
  }

  if (!Number.isInteger(options.timeoutMs) || options.timeoutMs < 1_000 || options.timeoutMs > 60_000) {
    throw new Error('--timeout-ms must be an integer from 1000 to 60000.');
  }
  if (!Number.isInteger(options.concurrency) || options.concurrency < 1 || options.concurrency > 32) {
    throw new Error('--concurrency must be an integer from 1 to 32.');
  }
  return options;
}

async function loadJson(relativePath, errors) {
  const filePath = path.join(PROJECT_ROOT, relativePath);
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    errors.push({ code: 'artifact-unreadable', path: relativePath, message: error.message });
    return null;
  }
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function normalizedUrl(rawUrl) {
  const url = new URL(rawUrl);
  url.hash = '';
  return url.toString();
}

function collectMarkdownUrls(markdown) {
  return [...String(markdown || '').matchAll(/https?:\/\/[^\s<>"'()[\]{}，。；、！？“”]+/giu)]
    .map((match) => match[0].replace(/[.,;:!?]+$/g, ''))
    .filter(Boolean);
}

async function wikiInventory() {
  const wikiDirectory = path.join(PROJECT_ROOT, 'wiki');
  const files = (await fs.readdir(wikiDirectory)).filter((file) => file.endsWith('.md')).sort();
  const slugs = new Set(files.map((file) => file.replace(/\.md$/, '')));
  const links = new Map();
  for (const file of files) {
    const markdown = await fs.readFile(path.join(wikiDirectory, file), 'utf8');
    for (const rawUrl of collectMarkdownUrls(markdown)) {
      try {
        const url = normalizedUrl(rawUrl);
        const entry = links.get(url) ?? { url, origins: [] };
        entry.origins.push(`wiki/${file}`);
        links.set(url, entry);
      } catch {
        // Invalid URLs are reported from the source registry or link inventory below.
        links.set(rawUrl, { url: rawUrl, origins: [`wiki/${file}`], invalid: true });
      }
    }
  }
  return { files, slugs, links };
}

function validateSources(registry, wiki, errors, warnings) {
  const sources = registry?.sources;
  if (!registry || !Array.isArray(sources)) {
    errors.push({ code: 'source-registry-shape', path: 'wiki/source-registry.json', message: 'sources[] is required.' });
    return { sources: [], registeredUrls: [] };
  }
  if (sources.length === 0) {
    errors.push({ code: 'source-registry-empty', path: 'wiki/source-registry.json', message: 'At least one canonical source is required.' });
  }

  const seenIds = new Set();
  const seenUrls = new Set();
  const allowedStatuses = new Set(registry.checkPolicy?.allowedStatuses ?? ['not-checked', 'healthy', 'blocked', 'broken']);
  for (const source of sources) {
    const context = `source:${source?.id ?? '<missing>'}`;
    if (typeof source?.id !== 'string' || !source.id.trim()) errors.push({ code: 'source-id', path: context, message: 'id is required.' });
    else if (seenIds.has(source.id)) errors.push({ code: 'source-id-duplicate', path: context, message: 'id must be unique.' });
    else seenIds.add(source.id);

    let url = null;
    try {
      url = normalizedUrl(source?.url);
      if (!['http:', 'https:'].includes(new URL(url).protocol)) throw new Error('only http(s) canonical sources are allowed');
      if (seenUrls.has(url)) warnings.push({ code: 'source-url-duplicate', path: context, message: url });
      seenUrls.add(url);
      const expectedHash = `sha256:${sha256(url)}`;
      if (
        source?.hash?.algorithm !== 'sha256' ||
        source?.hash?.scope !== 'canonical-url' ||
        source?.hash?.value !== expectedHash
      ) {
        errors.push({ code: 'source-url-hash', path: context, message: 'hash must be SHA-256 of the normalized URL.' });
      }
    } catch (error) {
      errors.push({ code: 'source-url', path: context, message: error.message });
    }

    if (typeof source?.kind !== 'string' || !source.kind.trim()) errors.push({ code: 'source-kind', path: context, message: 'kind is required.' });
    if (!Array.isArray(source?.pages) || source.pages.length === 0) {
      errors.push({ code: 'source-pages', path: context, message: 'pages[] must identify at least one dependent wiki page.' });
    } else {
      for (const slug of source.pages) {
        if (!wiki.slugs.has(slug)) errors.push({ code: 'source-page-missing', path: context, message: `Unknown wiki slug: ${slug}` });
      }
    }
    if (!Array.isArray(source?.evidence) || source.evidence.length === 0) {
      errors.push({ code: 'source-evidence', path: context, message: 'evidence[] must identify the page locations supported by this source.' });
    } else {
      for (const evidence of source.evidence) {
        if (typeof evidence?.slug !== 'string' || !source.pages.includes(evidence.slug)) {
          errors.push({ code: 'source-evidence-slug', path: context, message: `Evidence slug is not associated with the source: ${evidence?.slug}` });
        }
        if (!Array.isArray(evidence?.locations) || evidence.locations.length === 0) {
          errors.push({ code: 'source-evidence-locations', path: context, message: `Evidence locations are missing for ${evidence?.slug ?? '<unknown>'}.` });
        }
      }
    }

    const check = source?.check;
    if (!check || typeof check !== 'object') {
      errors.push({ code: 'source-check', path: context, message: 'check metadata is required.' });
    } else {
      if (!allowedStatuses.has(check.status)) {
        errors.push({ code: 'source-check-status', path: context, message: `Unsupported status: ${check.status}` });
      }
      if (['unavailable', 'error'].includes(check.status)) {
        errors.push({ code: 'source-known-broken', path: context, message: source.url });
      }
      if (check.checkedAt !== null && check.checkedAt !== undefined && Number.isNaN(Date.parse(check.checkedAt))) {
        errors.push({ code: 'source-checked-at', path: context, message: 'checkedAt must be null or an ISO timestamp.' });
      }
      if (check.contentHash !== null && check.contentHash !== undefined && !/^(?:sha256:)?[a-f0-9]{64}$/i.test(check.contentHash)) {
        errors.push({ code: 'source-content-hash', path: context, message: 'contentHash must be null or a SHA-256 digest.' });
      }
    }

    if (url) {
      const entry = wiki.links.get(url) ?? { url, origins: [] };
      entry.origins.push(context);
      wiki.links.set(url, entry);
    }
  }

  return { sources, registeredUrls: [...seenUrls] };
}

function validateQualityReport(quality, errors, warnings) {
  if (!quality) return {};
  const requiredSections = [
    'sourceCoverage',
    'citationCoverage',
    'reviewFreshness',
    'typedRelationCoverage',
    'retrievalReadiness'
  ];
  for (const section of requiredSections) {
    if (!quality[section] || typeof quality[section] !== 'object') {
      errors.push({ code: 'quality-section-missing', path: 'wiki/quality-report.json', message: `${section} is required.` });
    }
  }

  const warningCount = Number(quality.counts?.warnings ?? quality.warnings?.length ?? 0);
  if (!Number.isFinite(warningCount)) {
    errors.push({ code: 'quality-warning-count', path: 'wiki/quality-report.json', message: 'warning count is not numeric.' });
  } else if (warningCount > 0) {
    errors.push({ code: 'quality-warnings', path: 'wiki/quality-report.json', message: `${warningCount} maintenance warnings remain.` });
  }

  const overduePages = quality.reviewFreshness?.overduePages;
  if (Array.isArray(overduePages) && overduePages.length > 0) {
    errors.push({ code: 'review-overdue', path: 'wiki/quality-report.json', message: `${overduePages.length} pages are overdue for review.` });
  }
  const pendingReviewPages = quality.reviewFreshness?.pendingReviewPages;
  if (Array.isArray(pendingReviewPages) && pendingReviewPages.length > 0) {
    warnings.push({ code: 'review-pending', path: 'wiki/quality-report.json', message: `${pendingReviewPages.length} pages need an initial evidence review.` });
  }

  return {
    sourceCoverage: quality.sourceCoverage?.coverage ?? null,
    citationCoverage: quality.citationCoverage?.coverage ?? null,
    reviewFreshness: {
      currentPages: quality.reviewFreshness?.currentPages ?? null,
      overduePages: Array.isArray(overduePages) ? overduePages.length : null,
      pendingReviewPages: Array.isArray(pendingReviewPages) ? pendingReviewPages.length : null,
      nextReviewDue: quality.reviewFreshness?.nextReviewDue ?? null
    },
    typedRelationCoverage: quality.typedRelationCoverage?.coverage ?? null,
    retrievalReadiness: quality.retrievalReadiness?.coverage ?? null
  };
}

async function requestLink(url, timeoutMs) {
  const headers = {
    'User-Agent': 'Xinbaopedia-Maintenance-Audit/1.0 (+https://xinbaopedia.top)'
  };
  const attempt = async (method) => {
    const response = await fetch(url, {
      method,
      headers: method === 'GET' ? { ...headers, Range: 'bytes=0-1023' } : headers,
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs)
    });
    await response.body?.cancel();
    return { status: response.status, finalUrl: response.url, method };
  };

  let result = await attempt('HEAD');
  if (result.status < 200 || result.status >= 400) {
    try {
      result = await attempt('GET');
    } catch {
      // The HEAD response still provides a useful blocked/indeterminate result.
    }
  }
  return result;
}

function classifyLink(result) {
  if (result.error) return { classification: 'indeterminate', reason: result.error };
  const status = result.status;
  if (status >= 200 && status < 400) return { classification: 'healthy', reason: `HTTP ${status}` };
  if ([400, 404, 410].includes(status)) return { classification: 'broken', reason: `HTTP ${status}` };
  if ([401, 403, 405, 406, 408, 425, 429, 451, 999].includes(status) || status >= 500) {
    return { classification: 'indeterminate', reason: `HTTP ${status}` };
  }
  return { classification: 'broken', reason: `HTTP ${status}` };
}

async function checkLinks(entries, options) {
  const results = new Array(entries.length);
  let cursor = 0;
  async function worker() {
    while (cursor < entries.length) {
      const index = cursor++;
      const entry = entries[index];
      const startedAt = Date.now();
      try {
        const request = await requestLink(entry.url, options.timeoutMs);
        results[index] = {
          ...entry,
          ...request,
          ...classifyLink(request),
          durationMs: Date.now() - startedAt
        };
      } catch (error) {
        const detail = { error: error.name === 'TimeoutError' ? 'timeout' : error.message };
        results[index] = {
          ...entry,
          status: null,
          finalUrl: null,
          method: null,
          ...detail,
          ...classifyLink(detail),
          durationMs: Date.now() - startedAt
        };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(options.concurrency, entries.length) }, () => worker()));
  return results;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const errors = [];
  const warnings = [];
  const wiki = await wikiInventory();
  const [quality, sourceRegistry, publicSources, manifest, pages, graph, schema] = await Promise.all([
    loadJson('wiki/quality-report.json', errors),
    loadJson('wiki/source-registry.json', errors),
    loadJson('public/okf/sources.json', errors),
    loadJson('public/okf/manifest.json', errors),
    loadJson('public/okf/pages.json', errors),
    loadJson('public/okf/graph.json', errors),
    loadJson('public/okf/schema.json', errors)
  ]);

  const sourceSummary = validateSources(sourceRegistry, wiki, errors, warnings);
  const qualityMetrics = validateQualityReport(quality, errors, warnings);
  if (publicSources && !Array.isArray(publicSources.sources)) {
    errors.push({ code: 'public-sources-shape', path: 'public/okf/sources.json', message: 'sources[] is required.' });
  }
  if (manifest && manifest.okfVersion !== '0.1') {
    errors.push({ code: 'okf-version', path: 'public/okf/manifest.json', message: `Expected OKF 0.1, found ${manifest.okfVersion}` });
  }
  for (const [artifactPath, artifact] of [
    ['public/okf/pages.json', pages],
    ['public/okf/graph.json', graph],
    ['public/okf/schema.json', schema]
  ]) {
    if (artifact && artifact.okfVersion !== '0.1') {
      errors.push({ code: 'okf-version', path: artifactPath, message: `Expected OKF 0.1, found ${artifact.okfVersion}` });
    }
  }

  const invalidInventoryLinks = [...wiki.links.values()].filter((entry) => entry.invalid);
  for (const entry of invalidInventoryLinks) {
    errors.push({ code: 'external-url-invalid', path: entry.origins.join(', '), message: entry.url });
  }
  const linkEntries = [...wiki.links.values()]
    .filter((entry) => !entry.invalid)
    .map((entry) => ({ ...entry, origins: [...new Set(entry.origins)].sort() }))
    .sort((left, right) => left.url.localeCompare(right.url));
  const linkResults = options.checkLinks ? await checkLinks(linkEntries, options) : [];
  const brokenLinks = linkResults.filter((entry) => entry.classification === 'broken');
  const indeterminateLinks = linkResults.filter((entry) => entry.classification === 'indeterminate');
  for (const link of brokenLinks) {
    errors.push({ code: 'external-link-broken', path: link.origins.join(', '), message: `${link.url} (${link.reason})` });
  }
  if (options.strictIndeterminate) {
    for (const link of indeterminateLinks) {
      errors.push({ code: 'external-link-indeterminate', path: link.origins.join(', '), message: `${link.url} (${link.reason})` });
    }
  } else {
    for (const link of indeterminateLinks) {
      warnings.push({ code: 'external-link-indeterminate', path: link.origins.join(', '), message: `${link.url} (${link.reason})` });
    }
  }

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    auditor: 'scripts/audit-wiki-maintenance.mjs',
    mode: options.checkLinks ? 'structure-and-links' : 'structure-only',
    passed: errors.length === 0,
    summary: {
      wikiFiles: wiki.files.length,
      registeredSources: sourceSummary.sources.length,
      registeredSourceUrls: sourceSummary.registeredUrls.length,
      externalLinksDiscovered: linkEntries.length,
      externalLinksChecked: linkResults.length,
      healthyLinks: linkResults.filter((entry) => entry.classification === 'healthy').length,
      brokenLinks: brokenLinks.length,
      indeterminateLinks: indeterminateLinks.length,
      errors: errors.length,
      warnings: warnings.length
    },
    qualityMetrics,
    errors,
    warnings,
    links: linkResults
  };

  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  if (options.output) {
    await fs.mkdir(path.dirname(options.output), { recursive: true });
    await fs.writeFile(options.output, serialized, 'utf8');
    console.log(`Wiki maintenance audit ${report.passed ? 'passed' : 'failed'}: ${path.relative(PROJECT_ROOT, options.output)}`);
    console.log(JSON.stringify(report.summary));
  } else process.stdout.write(serialized);

  if (!report.passed && !options.noFail) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`Wiki maintenance audit could not run: ${error.stack ?? error.message}`);
  process.exitCode = 1;
});
