import fs from 'node:fs';
import path from 'node:path';

const SITE_ORIGIN = 'https://xinbaopedia.top';
const SITE_HOST = 'xinbaopedia.top';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const INDEXNOW_KEY = '977ab55cdd7bd5149d5143f5be4a88cc';
const KEY_FILE = `${INDEXNOW_KEY}.txt`;
const KEY_LOCATION = `${SITE_ORIGIN}/${KEY_FILE}`;

function fail(message) {
  process.stderr.write(`submit-indexnow: ${message}\n`);
  process.exit(1);
}

function normalizeUrls(values) {
  if (values.length === 0) fail('pass one or more https://xinbaopedia.top URLs');

  const urls = values.map((value) => {
    let url;
    try {
      url = new URL(value);
    } catch {
      fail(`invalid URL: ${value}`);
    }
    if (url.protocol !== 'https:' || url.hostname !== SITE_HOST || url.username || url.password || url.port) {
      fail(`URL must use the canonical ${SITE_ORIGIN} origin: ${value}`);
    }
    url.hash = '';
    return url.toString();
  });

  return [...new Set(urls)];
}

function verifyKeyFile() {
  const keyPath = path.join(process.cwd(), 'public', KEY_FILE);
  if (!fs.existsSync(keyPath)) fail(`missing public key file: public/${KEY_FILE}`);
  if (fs.readFileSync(keyPath, 'utf8').trim() !== INDEXNOW_KEY) fail('public key file does not match the configured IndexNow key');
}

const args = process.argv.slice(2);
const dryRun = args[0] === '--dry-run';
const urls = normalizeUrls(dryRun ? args.slice(1) : args);
verifyKeyFile();

const payload = {
  host: SITE_HOST,
  key: INDEXNOW_KEY,
  keyLocation: KEY_LOCATION,
  urlList: urls
};

if (dryRun) {
  process.stdout.write(`${JSON.stringify({ dryRun: true, endpoint: INDEXNOW_ENDPOINT, host: payload.host, keyLocation: payload.keyLocation, urlList: payload.urlList }, null, 2)}\n`);
  process.exit(0);
}

let response;
try {
  response = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000)
  });
} catch (error) {
  fail(`request failed: ${error instanceof Error ? error.message : String(error)}`);
}

if (!response.ok) fail(`IndexNow returned HTTP ${response.status}`);

process.stdout.write(`${JSON.stringify({ endpoint: INDEXNOW_ENDPOINT, status: response.status, submitted: urls.length, urlList: urls }, null, 2)}\n`);
