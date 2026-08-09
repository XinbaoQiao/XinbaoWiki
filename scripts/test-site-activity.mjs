import assert from 'node:assert/strict';
import fs from 'node:fs';

const route = fs.readFileSync('app/api/site-activity/route.ts', 'utf8');
const component = fs.readFileSync('components/VisitorAtlasDisclosure.tsx', 'utf8');
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

hasAll(route, [
  "const COMPLETE_DAYS = 30",
  "const CELL_DEGREES = 5",
  "const CELL_PUBLIC_THRESHOLD = 5",
  "const TOTAL_PUBLIC_THRESHOLD = 10",
  "const RETENTION_DAYS = 33"
], 'site activity publishes a delayed, thresholded, short-retention aggregate');
assert.match(route, /COOKIE_MAX_AGE_SECONDS = 60 \* 60 \* 24 \* RETENTION_DAYS/, 'browser identifier lifetime matches the aggregate retention purpose');
hasAll(route, [
  'function completedDateKeys',
  'const daysAgo = COMPLETE_DAYS - index',
  'today - daysAgo * DAY_MS'
], 'public window contains the previous 30 complete UTC days and excludes today');
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
  'visitor.shouldSet && !(await reserveCookieMint(redis, request, secret))'
], 'fresh signed-cookie issuance is bounded with a short-lived keyed Vercel-IP digest');
hasAll(route, [
  "const COOKIE_NAME = 'xinbao_site_vid'",
  "createHmac('sha256', secret)",
  'httpOnly: true',
  "path: '/'",
  "sameSite: 'lax'",
  "secure: process.env.NODE_ENV === 'production'"
], 'site activity uses a signed first-party HttpOnly browser identifier');
hasAll(route, [
  'const transaction = redis.multi()',
  'transaction.pfadd(allKey(dateKey), visitor.digest)',
  'transaction.pfadd(cellKey(dateKey, cellId), visitor.digest)',
  'transaction.sadd(cellsIndexKey(dateKey), cellId)',
  'transaction.expireat(cellsIndexKey(dateKey), expiresAt)',
  'await transaction.exec()'
], 'visit writes are atomic HLL and active-cell updates with absolute expiry');
hasAll(route, [
  'indexPipeline.smembers(cellsIndexKey(dateKey))',
  'slice(0, MAX_ACTIVE_CELLS)',
  'countPipeline.pfcount(firstAllKey, ...remainingAllKeys)',
  'uniqueBrowsersEstimate === null',
  '? []',
  'projectCell(cellId'
], 'public reads cap active cells, union HLLs, and suppress all geography below the total threshold');
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
assert.match(route, /return \{\s*level: count >= 25 \? 3 : count >= 10 \? 2 : 1,\s*x: Math\.round\(x\),\s*y: Math\.round\(y\)\s*\}/, 'public cells contain only projected coordinates and a three-level bucket');
assert.doesNotMatch(shared, /\bip\b|latitude|longitude|country|region|cellId|count:/i, 'browser payload type contains no IP, geographic labels, raw coordinates, cell identifier, or per-cell count');
assert.match(shared, /payload\.cells\.length > 256/, 'client rejects an unexpectedly large public cell payload');
hasAll(shared, [
  '!Number.isFinite(Date.parse(payload.generatedAt))',
  'window.completeDays !== 30',
  'thresholds.cell !== 5',
  'thresholds.total !== 10',
  '!payload.enabled && (uniqueBrowsersEstimate !== null || payload.cells.length > 0)'
], 'client validates the versioned time window, thresholds, and disabled-state schema');
hasAll(component, [
  "method: 'POST'",
  "cache: 'no-store'",
  "credentials: 'same-origin'",
  'parseSiteActivityPayload',
  "href={withBasePath('/maps/world-land-dots.svg')}"
], 'homepage records and reads through one same-origin endpoint, then renders the local static map');
assert.doesNotMatch(component, /country|region ranking|latitude|longitude|raw IP address/i, 'homepage exposes neither a geographic ranking nor raw location fields');
assert.match(map, /world-atlas 2\.0\.2 \/ Natural Earth/, 'generated neutral map records its source geometry');
assert.match(map, /<pattern id="dots"[\s\S]*<path[\s\S]*fill="url\(#dots\)"/, 'neutral map is a static dotted SVG silhouette');

console.log('site activity privacy and structure checks passed');
