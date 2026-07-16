import http from 'node:http';
import https from 'node:https';
import process from 'node:process';
import { biographyReleaseContract } from './release-contract.mjs';

const DEFAULT_SITE_URL = 'https://xinbaopedia.top';
const SITE_URL = process.env.SITE_URL || process.argv[2] || DEFAULT_SITE_URL;
const WIKI_SLUG = process.env.SMOKE_WIKI_SLUG || 'Xinbao_Qiao';
const HIDDEN_SLUG = process.env.SMOKE_HIDDEN_SLUG || 'Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning';

function positiveIntegerEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] || fallback, 10);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

const TIMEOUT_MS = positiveIntegerEnv('SMOKE_TIMEOUT_MS', '30000');
const MAX_ATTEMPTS = positiveIntegerEnv('SMOKE_ATTEMPTS', '3');
const RETRY_DELAY_MS = positiveIntegerEnv('SMOKE_RETRY_DELAY_MS', '1000');
const MAX_REDIRECTS = 5;
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

const base = new URL(SITE_URL);

function joinUrl(pathname) {
  return new URL(pathname, base).toString();
}

function requestOnce(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'http:' ? http : https;
    const req = client.request(parsed, { method: 'GET', headers: { 'user-agent': 'xinbaopedia-smoke/1.0' } }, (res) => {
      const status = res.statusCode || 0;
      const location = res.headers.location;
      if ([301, 302, 303, 307, 308].includes(status) && location) {
        res.resume();
        if (redirects >= MAX_REDIRECTS) {
          reject(new Error(`${url}: too many redirects`));
          return;
        }
        resolve(requestOnce(new URL(location, parsed).toString(), redirects + 1));
        return;
      }

      const chunks = [];
      res.setEncoding('utf8');
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          url,
          status,
          headers: res.headers,
          body: chunks.join('')
        });
      });
    });

    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy(new Error(`${url}: timed out after ${TIMEOUT_MS}ms`));
    });
    req.on('error', reject);
    req.end();
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(url) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await requestOnce(url);
      if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt === MAX_ATTEMPTS) {
        return response;
      }
      lastError = new Error(`${url}: retryable HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt === MAX_ATTEMPTS) throw error;
    }

    const delay = RETRY_DELAY_MS * attempt;
    console.warn(`Production smoke retry ${attempt + 1}/${MAX_ATTEMPTS} for ${url} after ${lastError.message}`);
    await wait(delay);
  }
  throw lastError;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertOk(response, label) {
  assert(response.status >= 200 && response.status < 300, `${label}: expected 2xx, got ${response.status} at ${response.url}`);
  assert(response.body.length > 0, `${label}: response body is empty`);
}

function parseJson(response, label) {
  assertOk(response, label);
  try {
    return JSON.parse(response.body);
  } catch (error) {
    throw new Error(`${label}: invalid JSON (${error.message})`);
  }
}

async function checkText(pathname, label, patterns) {
  const response = await request(joinUrl(pathname));
  assertOk(response, label);
  for (const pattern of patterns) {
    assert(pattern.test(response.body), `${label}: missing expected pattern ${pattern}`);
  }
  return response;
}

async function main() {
  await checkText('/', 'homepage', [/Xinbaopedia/i]);
  const wikiPath = WIKI_SLUG === 'Xinbao_Qiao'
    ? biographyReleaseContract.path
    : `/wiki/${encodeURIComponent(WIKI_SLUG)}/`;
  const wikiPatterns = WIKI_SLUG === 'Xinbao_Qiao'
    ? biographyReleaseContract.patterns
    : [/Xinbao/i, /wiki-page|Xinbaopedia/i];
  await checkText(wikiPath, 'wiki page', wikiPatterns);

  const manifest = parseJson(await request(joinUrl('/okf/manifest.json')), 'OKF manifest');
  assert(manifest.okfVersion === '0.1', `OKF manifest: expected okfVersion 0.1, got ${JSON.stringify(manifest.okfVersion)}`);
  assert(Number.isInteger(manifest.schemaVersion), 'OKF manifest: missing integer schemaVersion');

  const schema = parseJson(await request(joinUrl('/okf/schema.json')), 'OKF schema');
  assert(schema.okfVersion === '0.1', `OKF schema: expected okfVersion 0.1, got ${JSON.stringify(schema.okfVersion)}`);
  assert(Number.isInteger(schema.schemaVersion), 'OKF schema: missing integer schemaVersion');

  const graph = parseJson(await request(joinUrl('/okf/graph.json')), 'OKF graph');
  assert(graph.okfVersion === '0.1', `OKF graph: expected okfVersion 0.1, got ${JSON.stringify(graph.okfVersion)}`);
  assert(Number.isInteger(graph.schemaVersion), 'OKF graph: missing integer schemaVersion');
  assert(Array.isArray(graph.nodes), 'OKF graph: nodes must be an array');
  assert(Array.isArray(graph.edges), 'OKF graph: edges must be an array');

  const quality = parseJson(await request(joinUrl('/okf/quality-report.json')), 'OKF quality report');
  assert(quality.okfVersion === '0.1', `OKF quality report: expected okfVersion 0.1, got ${JSON.stringify(quality.okfVersion)}`);
  assert(Number.isInteger(quality.schemaVersion), 'OKF quality report: missing integer schemaVersion');
  assert(quality.counts?.warnings === 0, `OKF quality report: expected zero warnings, got ${JSON.stringify(quality.counts?.warnings)}`);
  assert(Array.isArray(quality.hiddenPages?.pages) && quality.hiddenPages.pages.length === 0, 'OKF quality report: hidden page slugs must not be exposed');

  const hiddenPath = `/wiki/${encodeURIComponent(HIDDEN_SLUG)}/`;
  const hiddenResponse = await request(joinUrl(hiddenPath));
  if (hiddenResponse.status >= 200 && hiddenResponse.status < 300) {
    const leaked = hiddenResponse.body.includes(HIDDEN_SLUG) || /Learn What Matters: Data Pruning for Efficient Decentralized Learning/i.test(hiddenResponse.body);
    assert(!leaked, `hidden slug leaked at ${hiddenPath}: got ${hiddenResponse.status} with hidden content`);
  } else {
    assert([403, 404, 410].includes(hiddenResponse.status), `hidden slug: expected 403/404/410 or non-leaking 2xx, got ${hiddenResponse.status}`);
  }

  console.log(`Production smoke passed for ${base.origin}`);
}

main().catch((error) => {
  console.error(`Production smoke failed: ${error.message}`);
  process.exit(1);
});
