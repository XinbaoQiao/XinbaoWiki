import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  legacyDateKeys,
  migrateLegacySiteActivity,
  publicSiteActivityEstimate,
  publicSiteActivityLevel,
  SITE_ACTIVITY_MAX_CELLS,
  SITE_ACTIVITY_MIGRATION_MAX_CELLS,
  siteActivityAggregationKeys
} from '../lib/site-activity-aggregation.ts';
import {
  isSiteActivityBrowserExcluded,
  SITE_ACTIVITY_EXCLUSION_COOKIE_NAME,
  SITE_ACTIVITY_PREFERENCE_COOKIE_MAX_AGE_SECONDS,
  SITE_ACTIVITY_VISITOR_COOKIE_NAME,
  siteActivityExclusionCookieValue
} from '../lib/site-activity-preference.ts';
import { shouldRecordSiteActivityRequest } from '../lib/site-activity.ts';
import {
  createSiteActivityOwnerPasswordHash,
  isSiteActivityOwnerPasswordHash,
  reserveSiteActivityOwnerRateLimit,
  SITE_ACTIVITY_OWNER_RATE_LIMIT,
  SITE_ACTIVITY_OWNER_RATE_LIMIT_WINDOW_SECONDS,
  siteActivityOwnerRateLimitKey,
  verifySiteActivityOwnerPassword
} from '../lib/site-activity-owner-auth.ts';

const route = fs.readFileSync('app/api/site-activity/route.ts', 'utf8');
const versionedRoute = fs.readFileSync('app/api/site-activity/v2/route.ts', 'utf8');
const preferenceRoute = fs.readFileSync('app/api/site-activity/preference/route.ts', 'utf8');
const ownerAuth = fs.readFileSync('lib/site-activity-owner-auth.ts', 'utf8');
const aggregation = fs.readFileSync('lib/site-activity-aggregation.ts', 'utf8');
const component = fs.readFileSync('components/VisitorAtlasDisclosure.tsx', 'utf8');
const playwrightConfig = fs.readFileSync('playwright.config.mjs', 'utf8');
const shared = fs.readFileSync('lib/site-activity.ts', 'utf8');
const map = fs.readFileSync('public/maps/world-land-dots.svg', 'utf8');

function hasAll(text, needles, label) {
  let index = -1;
  for (const needle of needles) {
    const next = text.indexOf(needle, index + 1);
    assert.notEqual(next, -1, `${label}: missing ${needle}`);
    index = next;
  }
}

hasAll(aggregation, [
  'SITE_ACTIVITY_CELL_THRESHOLD = 2',
  'SITE_ACTIVITY_TOTAL_THRESHOLD = 2',
  'SITE_ACTIVITY_MAX_CELLS = 512',
  'SITE_ACTIVITY_MIGRATION_MAX_CELLS = 1988',
  "SITE_ACTIVITY_KEY_PREFIX = 'xinbao-site-activity:v2'",
  "SITE_ACTIVITY_LEGACY_KEY_PREFIX = 'xinbao-site-activity:v1'"
], 'site activity publishes an isolated two-browser lifetime aggregate');
hasAll(route, [
  "const CELL_DEGREES = 5",
  "const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 400"
], 'site activity uses five-degree cells and a long-lived signed browser identifier');
assert.equal(shouldRecordSiteActivityRequest({ hostname: 'xinbaopedia.top', userAgent: 'Mozilla/5.0 Chrome/140.0' }), true, 'ordinary canonical browsers are recorded');
assert.equal(shouldRecordSiteActivityRequest({ hostname: 'XINBAOPEDIA.TOP.', userAgent: 'Mozilla/5.0' }), true, 'canonical hostname matching is normalized');
assert.equal(shouldRecordSiteActivityRequest({ hostname: 'xinbaopedia-preview.vercel.app', userAgent: 'Mozilla/5.0' }), false, 'Vercel preview deployments are excluded');
assert.equal(shouldRecordSiteActivityRequest({ hostname: 'localhost', userAgent: 'Mozilla/5.0' }), false, 'local servers are excluded by default');
assert.equal(shouldRecordSiteActivityRequest({ hostname: 'localhost', testMode: true, userAgent: 'HeadlessChrome/140.0' }), true, 'explicit test mode enables loopback regression recording');
assert.equal(shouldRecordSiteActivityRequest({ hostname: 'xinbaopedia-preview.vercel.app', testMode: true, userAgent: 'Mozilla/5.0' }), false, 'test mode cannot enable a remote preview host');
for (const userAgent of [
  'Mozilla/5.0 HeadlessChrome/140.0',
  'Playwright/1.61',
  'Puppeteer/24.0',
  'xinbaopedia-smoke/123',
  'xinbaopedia-staged-canary/123-grounded',
  'xinbaopedia-deployment-browser-qa/1',
  'xinbaopedia-future-deployment/1',
  'xinbaopedia-publish-preflight'
]) {
  assert.equal(shouldRecordSiteActivityRequest({ hostname: 'xinbaopedia.top', userAgent }), false, `${userAgent} is excluded from canonical activity`);
}
hasAll(route, [
  'function shouldRecordVisit(request: NextRequest)',
  'shouldRecordSiteActivityRequest({',
  'hostname: new URL(request.url).hostname',
  "testMode: process.env.SITE_ACTIVITY_TEST_MODE === 'true'",
  "userAgent: request.headers.get('user-agent')",
  'if (!shouldRecordVisit(request)) return privateResponse(204)',
  'if (!sameOriginRequest(request)) return privateResponse(403)'
], 'recording rejects non-canonical and deployment-automation traffic before request validation');
hasAll(playwrightConfig, [
  "const deploymentBrowserUserAgent = 'xinbaopedia-deployment-browser-qa/1'",
  'externalBaseUrl ? { userAgent: deploymentBrowserUserAgent } : {}',
  "SITE_ACTIVITY_TEST_MODE: 'true'"
], 'external browser QA is marked for exclusion while local recording tests use an explicit loopback-only mode');
assert.doesNotMatch(`${route}\n${aggregation}`, /\bCOMPLETE_DAYS\b|\bexpiryForDateKey\b|\.expireat\(/, 'lifetime aggregate has no rolling day window or automatic aggregate expiry');
hasAll(route, [
  "process.env.VERCEL !== '1'",
  "request.headers.get('x-vercel-ip-latitude')",
  "request.headers.get('x-vercel-ip-longitude')",
  'quantize(latitude',
  'quantize(longitude'
], 'geo input is accepted only from Vercel system headers and quantized before storage');
assert.doesNotMatch(route, /request\.headers\.get\('x-forwarded-for'\)|x-real-ip|ipAddress\(|navigator\.geolocation/, 'site activity never trusts generic proxy IP headers or browser geolocation');
hasAll(route, [
  'COOKIE_MINT_LIMIT_PER_HOUR = 4',
  "request.headers.get('x-vercel-forwarded-for')",
  'site-activity-cookie-mint:',
  'const key = cookieMintKey(requestIp, secret)',
  'transaction.incr(key)',
  'transaction.expire(key, COOKIE_MINT_TTL_SECONDS)',
  'mintCount <= COOKIE_MINT_LIMIT_PER_HOUR',
  'visitor.requiresMintReservation && !(await reserveCookieMint(redis, request, secret))'
], 'fresh signed-cookie issuance is bounded with a short-lived keyed Vercel-IP digest');
hasAll(route, [
  'const COOKIE_NAME = SITE_ACTIVITY_VISITOR_COOKIE_NAME',
  "const COOKIE_VERSION = 'v2'",
  "createHmac('sha256', secret)",
  'requiresMintReservation: false',
  'shouldSet: legacy',
  'value: legacy ? `${COOKIE_VERSION}.${visitorId}.${signature}` : existing',
  'requiresMintReservation: true',
  'httpOnly: true',
  "path: '/'",
  "sameSite: 'lax'",
  "secure: process.env.NODE_ENV === 'production'"
], 'site activity uses a signed first-party HttpOnly browser identifier');
const exclusionCookie = siteActivityExclusionCookieValue('test-secret');
assert.equal(isSiteActivityBrowserExcluded(exclusionCookie, 'test-secret'), true, 'server-issued exclusion cookie verifies');
assert.equal(isSiteActivityBrowserExcluded(exclusionCookie, 'other-secret'), false, 'exclusion cookie does not survive a secret mismatch');
assert.equal(isSiteActivityBrowserExcluded(`${exclusionCookie}0`, 'test-secret'), false, 'malformed exclusion cookie is rejected');
assert.equal(SITE_ACTIVITY_EXCLUSION_COOKIE_NAME, 'xinbao_site_activity_excluded');
assert.equal(SITE_ACTIVITY_VISITOR_COOKIE_NAME, 'xinbao_site_vid');
assert.equal(SITE_ACTIVITY_PREFERENCE_COOKIE_MAX_AGE_SECONDS, 34_560_000, 'browser exclusion lasts at most 400 days');
hasAll(preferenceRoute, [
  "'Cache-Control': 'private, no-store'",
  "process.env.SITE_ACTIVITY_OWNER_PASSWORD_HASH",
  'process.env.UPSTASH_REDIS_REST_URL',
  'process.env.UPSTASH_REDIS_REST_TOKEN',
  'isSiteActivityOwnerPasswordHash(ownerPasswordHash())',
  'async function readCappedBody(request: NextRequest, maximumBytes: number)',
  'request.body.getReader()',
  'await reader.cancel()',
  'async function parsePreferenceBody(request: NextRequest)',
  "content-type",
  'httpOnly: true',
  "path: '/'",
  "sameSite: 'strict'",
  'export async function GET(request: NextRequest)',
  'isSiteActivityBrowserExcluded(',
  'export async function POST(request: NextRequest)',
  'if (!sameOriginRequest(request)) return privateResponse(403)',
  'if (!body) return privateResponse(400)',
  "request.headers.get('x-vercel-forwarded-for')",
  'reserveSiteActivityOwnerRateLimit(',
  "return privateResponse(429, { 'Retry-After': String(reservation.retryAfterSeconds) })",
  'verifySiteActivityOwnerPassword(body.password, passwordHash)',
  'return privateResponse(401)',
  "response.cookies.set(",
  'siteActivityExclusionCookieValue(secret)',
  'body.excluded ? cookieOptions() : { ...cookieOptions(), maxAge: 0 }'
], 'owner preference endpoint is same-origin, private, hashed, rate-limited, and reversible');
assert.match(route, /request\.arrayBuffer\(\)[\s\S]*byteLength === 0[\s\S]*await acceptsEmptyBody\(request\)/, 'recording consumes and rejects non-empty streamed or chunked request bodies even without Content-Length');
assert.match(preferenceRoute, /length \+ value\.byteLength > maximumBytes[\s\S]*await reader\.cancel\(\)[\s\S]*const keys = Object\.keys\(value\)[\s\S]*keys\.length !== 2[\s\S]*passwordLength > 256/, 'owner preference caps streamed bodies and rejects malformed, extra-key, and oversized JSON before password verification');
assert.match(preferenceRoute, /process\.env\.VERCEL === '1'[\s\S]*request\.headers\.get\('x-vercel-forwarded-for'\)[\s\S]*if \(!redis \|\| !requestIp\) return privateResponse\(503\)/, 'production owner rate limiting requires a trusted Vercel forwarding IP and fails closed when unavailable');
assert.doesNotMatch(preferenceRoute, /console\.(?:log|error)\([^)]*password|console\.(?:log|error)\([^)]*request/i, 'owner endpoint does not log the password or request body');
assert.doesNotMatch(`${component}\n${preferenceRoute}\n${ownerAuth}`, /NEXT_PUBLIC_[A-Z0-9_]*OWNER|SITE_ACTIVITY_OWNER_PASSWORD\s*[:=]\s*['"]/i, 'owner password configuration is server-only and never embedded as a plaintext assignment');
hasAll(route, [
  'const secret = process.env.RATE_LIMIT_SALT',
  'isSiteActivityBrowserExcluded(request.cookies.get(SITE_ACTIVITY_EXCLUSION_COOKIE_NAME)?.value, secret)',
  'return privateResponse(204)',
  'const visitor = getVisitorCookie(request, secret)',
  'const cellId = requestCell(request)'
], 'a valid exclusion cookie stops recording before visitor minting or geographic lookup');
assert.doesNotMatch(preferenceRoute, /x-vercel-ip|x-forwarded-for|latitude|longitude|country|region/i, 'browser exclusion cookie itself never depends on an IP or geographic allowlist');
hasAll(route, [
  'const transaction = redis.multi()',
  'transaction.pfadd(siteActivityAggregationKeys.lifetimeAll(), visitor.digest)',
  'transaction.pfadd(siteActivityAggregationKeys.lifetimeCell(cellId), visitor.digest)',
  'transaction.sadd(siteActivityAggregationKeys.lifetimeCellsIndex(), cellId)',
  'await transaction.exec()'
], 'visit writes are atomic lifetime HLL and active-cell updates without rolling expiration');
hasAll(aggregation, [
  'MIGRATION_BATCH_SIZE = 128',
  'MIGRATION_LOCK_SECONDS = 300',
  'MIGRATION_RECHECK_SECONDS = 900',
  "{ ex: MIGRATION_LOCK_SECONDS, nx: true }",
  "if (lockResult !== 'OK') return 'busy'",
  'for (const batch of chunked(cellIds, MIGRATION_BATCH_SIZE))',
  'migration.pfmerge(',
  'complete: nextPasses >= 3',
  'migrationReceipt(), JSON.stringify(nextReceipt)'
], 'launch-period version 1 HLLs use a distributed lock, bounded batches, and a second catch-up pass');
hasAll(route, [
  'await migrateLegacySiteActivity(redis, secret, SITE_ACTIVITY_SINCE, now)',
  "logSiteActivityIssue('legacy aggregate migration failed')",
  'const activeCells = await redis.smembers(siteActivityAggregationKeys.lifetimeCellsIndex())',
  'slice(0, SITE_ACTIVITY_MAX_CELLS)',
  'countPipeline.pfcount(siteActivityAggregationKeys.lifetimeAll())',
  'countPipeline.pfcount(siteActivityAggregationKeys.lifetimeCell(cellId))',
  'uniqueBrowsersEstimate === null',
  '? []',
  'projectCell(cellId'
], 'public reads continue from the lifetime HLLs when migration is busy or fails and suppress all geography below the total threshold');
assert.doesNotMatch(route, /migrationState === 'busy'[^\n]*privateResponse\(503\)/, 'a migration lock never turns an otherwise readable public aggregate into a 503');
hasAll(versionedRoute, [
  "from '../route'",
  "export const dynamic = 'force-dynamic'",
  "export const runtime = 'nodejs'",
  'export const GET = getSiteActivity',
  'export const POST = recordSiteActivity'
], 'schema v2 has a stable versioned route while the unversioned handler remains available to older open pages');
assert.match(route, /cellSelectionScore\(left, secret\).*cellSelectionScore\(right, secret\)/, 'active-cell overflow uses deterministic non-geographic sampling rather than lexicographic bias');
hasAll(route, [
  "'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=900'",
  "'Cache-Control': 'private, no-store'"
], 'anonymous GET responses are briefly shared-cached while POST remains private and uncached');
hasAll(route, [
  'export async function GET(request: NextRequest)',
  'if (new URL(request.url).search) return privateResponse(400)'
], 'GET rejects query variants that would bypass the shared cache key');
for (const expected of [
  'if (!redis || !secret) return privateResponse(204)',
  'if (!redis || !secret) return publicJson(empty)',
  "logSiteActivityIssue('visit aggregation failed')",
  "logSiteActivityIssue('public aggregation read failed')",
  'return privateResponse(503)'
]) {
  assert.ok(route.includes(expected), `missing configuration and Redis failure boundary: missing ${expected}`);
}
assert.match(route, /const level = publicSiteActivityLevel\(count\);[\s\S]*return \{\s*level,\s*x: Math\.round\(x\),\s*y: Math\.round\(y\)\s*\}/, 'public cells contain only projected coordinates and the reviewed three-level bucket');
assert.doesNotMatch(shared, /\bip\b|latitude|longitude|country|region|cellId|count:/i, 'browser payload type contains no IP, geographic labels, raw coordinates, cell identifier, or per-cell count');
assert.match(shared, /payload\.cells\.length > 512/, 'client rejects a public cell payload beyond the bounded aggregate response');
hasAll(shared, [
  'SITE_ACTIVITY_SCHEMA_VERSION = 2',
  'SITE_ACTIVITY_API_PATH = `/api/site-activity/v${SITE_ACTIVITY_SCHEMA_VERSION}/`',
  "SITE_ACTIVITY_SINCE = '2026-08-09'",
  '!Number.isFinite(Date.parse(payload.generatedAt))',
  "period.scope !== 'lifetime'",
  'period.since !== SITE_ACTIVITY_SINCE',
  'thresholds.cell !== 2',
  'thresholds.total !== 2',
  '!payload.enabled && (uniqueBrowsersEstimate !== null || payload.cells.length > 0)'
], 'client validates the lifetime period, two-browser thresholds, and disabled-state schema');
for (const expected of [
  "method: 'POST'",
  "cache: 'no-store'",
  "credentials: 'same-origin'",
  'parseSiteActivityPayload',
  'const apiPath = withBasePath(SITE_ACTIVITY_API_PATH)',
  "href={withBasePath('/maps/world-land-dots.svg')}"
]) {
  assert.ok(component.includes(expected), `homepage same-origin map flow is missing ${expected}`);
}
hasAll(component, [
  "retry: 'Retry'",
  "retry: '\u91cd\u8bd5'",
  'const retryDelays = [0, 500, 1500, 3000]',
  "error instanceof DOMException && error.name === 'AbortError'",
  'if (attempt < retryDelays.length - 1) continue',
  "response.status === 408 || response.status === 429 || response.status >= 500",
  'void fetchSiteActivity(apiPath, controller.signal)',
  'setRequestVersion((version) => version + 1)'
], 'homepage retries transport and transient server failures before exposing a bilingual manual retry');
assert.doesNotMatch(component, /country|region ranking|latitude|longitude|raw IP address/i, 'homepage exposes neither a geographic ranking nor raw location fields');
assert.match(component, /summaryFallback: 'All history'[\s\S]*uniqueBrowsers: \(count: number\) => `≈ \$\{count\.toLocaleString\('en'\)\} browsers · all history`/, 'homepage summary presents the complete collected history rather than a rolling window');
assert.doesNotMatch(component, /Cells appear|Approximate IP|No map cell|30 complete|\u8fd1 30|wiki-visitor-atlas-note/, 'homepage removes visible threshold, approximation, empty-state, and rolling-window explanations');
assert.match(map, /world-atlas 2\.0\.2 \/ Natural Earth/, 'generated neutral map records its source geometry');
assert.match(map, /<pattern id="dots"[\s\S]*<path[\s\S]*fill="url\(#dots\)"/, 'neutral map is a static dotted SVG silhouette');

const ownerTestPassword = 'owner-test-password';
const ownerTestHash = await createSiteActivityOwnerPasswordHash(
  ownerTestPassword,
  '00112233445566778899aabbccddeeff'
);
assert.equal(isSiteActivityOwnerPasswordHash(ownerTestHash), true, 'fixed test scrypt envelope is accepted');
assert.equal(await verifySiteActivityOwnerPassword(ownerTestPassword, ownerTestHash), true, 'owner password verifier accepts the test password');
assert.equal(await verifySiteActivityOwnerPassword('wrong-owner-password', ownerTestHash), false, 'owner password verifier rejects an incorrect password');
assert.equal(isSiteActivityOwnerPasswordHash('owner-test-password'), false, 'plaintext owner password is not a valid deployment configuration');

class FakeOwnerRateLimitStore {
  constructor() {
    this.counts = new Map();
    this.expirations = new Map();
    this.fail = false;
  }

  multi() {
    const operations = [];
    const transaction = {
      incr: (key) => {
        operations.push(() => {
          const count = (this.counts.get(key) ?? 0) + 1;
          this.counts.set(key, count);
          return count;
        });
        return transaction;
      },
      expire: (key, seconds) => {
        operations.push(() => {
          this.expirations.set(key, seconds);
          return 1;
        });
        return transaction;
      },
      exec: async () => {
        if (this.fail) throw new Error('simulated owner rate-limit failure');
        return operations.map((operation) => operation());
      }
    };
    return transaction;
  }
}

const ownerRateStore = new FakeOwnerRateLimitStore();
const ownerRateIp = '203.0.113.10';
const ownerRateFixture = 'owner-rate-test-fixture';
const ownerRateNow = 1_700_000_000_000;
const ownerRateKey = siteActivityOwnerRateLimitKey(ownerRateIp, ownerRateFixture, ownerRateNow);
assert.equal(ownerRateKey.includes(ownerRateIp), false, 'owner rate-limit key never stores the raw IP');
assert.notEqual(ownerRateKey, siteActivityOwnerRateLimitKey('203.0.113.11', ownerRateFixture, ownerRateNow), 'different IPs use independent keyed rate-limit buckets');
assert.equal(
  SITE_ACTIVITY_OWNER_RATE_LIMIT_WINDOW_SECONDS,
  900,
  'owner password attempts use the reviewed fifteen-minute rate-limit window'
);
for (let attempt = 1; attempt <= SITE_ACTIVITY_OWNER_RATE_LIMIT; attempt += 1) {
  const reservation = await reserveSiteActivityOwnerRateLimit(ownerRateStore, ownerRateKey, ownerRateNow);
  assert.equal(reservation.allowed, true, `owner attempt ${attempt} remains within the limit`);
  assert.equal(reservation.count, attempt, `owner attempt ${attempt} increments the keyed counter once`);
}
const blockedOwnerAttempt = await reserveSiteActivityOwnerRateLimit(ownerRateStore, ownerRateKey, ownerRateNow);
assert.equal(blockedOwnerAttempt.allowed, false, 'the sixth owner attempt is rate limited');
assert.ok(blockedOwnerAttempt.retryAfterSeconds >= 1, 'rate-limited owner attempts expose a positive retry window');
assert.equal(ownerRateStore.expirations.get(ownerRateKey), SITE_ACTIVITY_OWNER_RATE_LIMIT_WINDOW_SECONDS, 'owner rate-limit buckets expire after fifteen minutes');
ownerRateStore.fail = true;
await assert.rejects(
  reserveSiteActivityOwnerRateLimit(ownerRateStore, siteActivityOwnerRateLimitKey('203.0.113.12', ownerRateFixture, ownerRateNow), ownerRateNow),
  /simulated owner rate-limit failure/,
  'a Redis rate-limit failure reaches the route so it can fail closed with 503'
);

class FakeMigrationRedis {
  constructor(now) {
    this.expirations = new Map();
    this.failPipelineExec = null;
    this.hlls = new Map();
    this.maxPipelineOperations = 0;
    this.nowMs = now.getTime();
    this.pipelineExecCount = 0;
    this.sets = new Map();
    this.values = new Map();
  }

  advance(milliseconds) {
    this.nowMs += milliseconds;
  }

  expireKeys() {
    for (const [key, expiresAt] of this.expirations) {
      if (expiresAt <= this.nowMs) {
        this.expirations.delete(key);
        this.values.delete(key);
      }
    }
  }

  async get(key) {
    this.expireKeys();
    return this.values.get(key) ?? null;
  }

  async set(key, value, options = {}) {
    this.expireKeys();
    if (options.nx && this.values.has(key)) return null;
    this.values.set(key, value);
    if (options.ex) this.expirations.set(key, this.nowMs + options.ex * 1000);
    return 'OK';
  }

  pipeline() {
    const operations = [];
    const pipeline = {
      exec: async () => {
        this.pipelineExecCount += 1;
        this.maxPipelineOperations = Math.max(this.maxPipelineOperations, operations.length);
        const results = [];
        for (let index = 0; index < operations.length; index += 1) {
          results.push(operations[index]());
          if (this.failPipelineExec === this.pipelineExecCount && index === 0) {
            throw new Error('simulated partial pipeline failure');
          }
        }
        return results;
      },
      pfmerge: (destination, source, ...sources) => {
        operations.push(() => {
          const union = new Set();
          for (const key of [source, ...sources]) {
            for (const value of this.hlls.get(key) ?? []) union.add(value);
          }
          this.hlls.set(destination, union);
          return 'OK';
        });
        return pipeline;
      },
      sadd: (key, member, ...members) => {
        operations.push(() => {
          const target = this.sets.get(key) ?? new Set();
          const previousSize = target.size;
          for (const value of [member, ...members]) target.add(value);
          this.sets.set(key, target);
          return target.size - previousSize;
        });
        return pipeline;
      },
      smembers: (key) => {
        operations.push(() => [...(this.sets.get(key) ?? [])]);
        return pipeline;
      }
    };
    return pipeline;
  }

  seedHll(key, values) {
    this.hlls.set(key, new Set(values));
  }

  seedSet(key, values) {
    this.sets.set(key, new Set(values));
  }
}

const firstMigrationAt = new Date('2026-08-10T00:00:00.000Z');
assert.deepEqual(
  legacyDateKeys('2026-08-09', firstMigrationAt),
  ['2026-08-09', '2026-08-10'],
  'legacy migration includes launch day and the current UTC day'
);
assert.equal(publicSiteActivityEstimate(1), null, 'one browser identifier keeps the total private');
assert.equal(publicSiteActivityEstimate(2), 2, 'two browser identifiers publish the lifetime estimate');
assert.equal(publicSiteActivityLevel(1), null, 'one browser identifier keeps a cell private');
assert.equal(publicSiteActivityLevel(2), 1, 'two browser identifiers publish a low-intensity cell');
assert.equal(publicSiteActivityLevel(5), 2, 'five browser identifiers publish a medium-intensity cell');
assert.equal(publicSiteActivityLevel(10), 3, 'ten browser identifiers publish a high-intensity cell');

const migrationRedis = new FakeMigrationRedis(firstMigrationAt);
const migrationKeys = siteActivityAggregationKeys;
migrationRedis.seedHll(migrationKeys.legacyAll('2026-08-09'), ['browser-a', 'browser-b']);
migrationRedis.seedHll(migrationKeys.legacyAll('2026-08-10'), ['browser-b', 'browser-c']);
migrationRedis.seedSet(migrationKeys.legacyCellsIndex('2026-08-09'), ['10:20']);
migrationRedis.seedSet(migrationKeys.legacyCellsIndex('2026-08-10'), ['10:20', '15:25']);
migrationRedis.seedHll(migrationKeys.legacyCell('2026-08-09', '10:20'), ['browser-a']);
migrationRedis.seedHll(migrationKeys.legacyCell('2026-08-10', '10:20'), ['browser-b']);
migrationRedis.seedHll(migrationKeys.legacyCell('2026-08-10', '15:25'), ['browser-c']);

assert.equal(
  await migrateLegacySiteActivity(migrationRedis, 'test-secret', '2026-08-09', firstMigrationAt),
  'ready',
  'first legacy migration pass completes'
);
assert.deepEqual(
  [...migrationRedis.hlls.get(migrationKeys.lifetimeAll())].sort(),
  ['browser-a', 'browser-b', 'browser-c'],
  'first migration unions daily totals without double-counting a repeated identifier'
);
assert.deepEqual(
  [...migrationRedis.hlls.get(migrationKeys.lifetimeCell('10:20'))].sort(),
  ['browser-a', 'browser-b'],
  'first migration unions each legacy cell HLL'
);
assert.deepEqual(
  [...migrationRedis.sets.get(migrationKeys.lifetimeCellsIndex())].sort(),
  ['10:20', '15:25'],
  'first migration builds the lifetime active-cell index'
);
const firstReceipt = JSON.parse(await migrationRedis.get(migrationKeys.migrationReceipt()));
assert.deepEqual(
  { complete: firstReceipt.complete, passes: firstReceipt.passes },
  { complete: false, passes: 1 },
  'first pass leaves a pending receipt for rollout catch-up'
);
const pipelineCountAfterFirstPass = migrationRedis.pipelineExecCount;
assert.equal(
  await migrateLegacySiteActivity(migrationRedis, 'test-secret', '2026-08-09', firstMigrationAt),
  'ready',
  'a request inside the catch-up interval reuses the receipt'
);
assert.equal(migrationRedis.pipelineExecCount, pipelineCountAfterFirstPass, 'receipt prevents duplicate migration work');

migrationRedis.seedHll(migrationKeys.legacyAll('2026-08-10'), ['browser-b', 'browser-c', 'browser-d']);
migrationRedis.seedHll(migrationKeys.legacyCell('2026-08-10', '10:20'), ['browser-b', 'browser-d']);
migrationRedis.advance(901_000);
const catchUpAt = new Date(firstMigrationAt.getTime() + 901_000);
assert.equal(
  await migrateLegacySiteActivity(migrationRedis, 'test-secret', '2026-08-09', catchUpAt),
  'ready',
  'first catch-up pass catches a late version 1 writer after rollout'
);
assert.ok(
  migrationRedis.hlls.get(migrationKeys.lifetimeAll()).has('browser-d'),
  'second pass carries the late legacy identifier into lifetime history'
);
const finalReceipt = JSON.parse(await migrationRedis.get(migrationKeys.migrationReceipt()));
assert.deepEqual(
  { complete: finalReceipt.complete, passes: finalReceipt.passes },
  { complete: false, passes: 2 },
  'first catch-up pass keeps the receipt open for a wider rollout window'
);
migrationRedis.seedHll(migrationKeys.legacyAll('2026-08-10'), ['browser-b', 'browser-c', 'browser-d', 'browser-e']);
migrationRedis.advance(901_000);
const finalCatchUpAt = new Date(catchUpAt.getTime() + 901_000);
await migrateLegacySiteActivity(migrationRedis, 'test-secret', '2026-08-09', finalCatchUpAt);
assert.ok(
  migrationRedis.hlls.get(migrationKeys.lifetimeAll()).has('browser-e'),
  'final catch-up pass carries a later legacy write into lifetime history'
);
const completedReceipt = JSON.parse(await migrationRedis.get(migrationKeys.migrationReceipt()));
assert.deepEqual(
  { complete: completedReceipt.complete, passes: completedReceipt.passes },
  { complete: true, passes: 3 },
  'third pass seals the migration receipt after a 30-minute catch-up window'
);

const lockedRedis = new FakeMigrationRedis(firstMigrationAt);
await lockedRedis.set(migrationKeys.migrationLock(), 'another-request', { ex: 300, nx: true });
assert.equal(
  await migrateLegacySiteActivity(lockedRedis, 'test-secret', '2026-08-09', firstMigrationAt),
  'busy',
  'a distributed lock prevents concurrent full migrations'
);

const retryRedis = new FakeMigrationRedis(firstMigrationAt);
retryRedis.seedHll(migrationKeys.legacyAll('2026-08-09'), ['browser-a', 'browser-b']);
retryRedis.seedSet(migrationKeys.legacyCellsIndex('2026-08-09'), ['10:20']);
retryRedis.seedHll(migrationKeys.legacyCell('2026-08-09', '10:20'), ['browser-a', 'browser-b']);
retryRedis.failPipelineExec = 3;
await assert.rejects(
  migrateLegacySiteActivity(retryRedis, 'test-secret', '2026-08-09', firstMigrationAt),
  /simulated partial pipeline failure/,
  'a partial migration failure reaches the caller'
);
assert.equal(await retryRedis.get(migrationKeys.migrationReceipt()), null, 'a partial failure never writes a success receipt');
retryRedis.failPipelineExec = null;
retryRedis.advance(901_000);
await migrateLegacySiteActivity(
  retryRedis,
  'test-secret',
  '2026-08-09',
  new Date(firstMigrationAt.getTime() + 901_000)
);
assert.deepEqual(
  [...retryRedis.hlls.get(migrationKeys.lifetimeCell('10:20'))].sort(),
  ['browser-a', 'browser-b'],
  'an idempotent retry repairs a partial migration'
);

const batchedRedis = new FakeMigrationRedis(firstMigrationAt);
const validCells = [];
for (let latitude = -55; latitude <= 80; latitude += 5) {
  for (let longitude = -175; longitude <= 175; longitude += 5) {
    validCells.push(`${latitude}:${longitude}`);
  }
}
batchedRedis.seedSet(migrationKeys.legacyCellsIndex('2026-08-09'), validCells);
for (const cellId of validCells) {
  batchedRedis.seedHll(migrationKeys.legacyCell('2026-08-09', cellId), [`browser-${cellId}`]);
}
await migrateLegacySiteActivity(batchedRedis, 'test-secret', '2026-08-09', firstMigrationAt);
assert.ok(
  batchedRedis.maxPipelineOperations <= 129,
  'large migrations are split into at most 128 cell merges plus one index update per pipeline'
);
assert.equal(
  batchedRedis.sets.get(migrationKeys.lifetimeCellsIndex()).size,
  validCells.length,
  'every cell survives migration across multiple batches'
);
assert.ok(
  batchedRedis.hlls.get(migrationKeys.lifetimeCell(validCells.at(-1))).has(`browser-${validCells.at(-1)}`),
  'the final migration batch carries its HLL data into lifetime storage'
);
assert.equal(SITE_ACTIVITY_MAX_CELLS, 512, 'public reads retain a bounded display ceiling');
assert.equal(
  SITE_ACTIVITY_MIGRATION_MAX_CELLS,
  validCells.length,
  'migration retains the complete valid five-degree grid independently of the public display cap'
);

console.log('site activity privacy and structure checks passed');
