import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
// Next resolves extensionless TS imports; native Node tests need this one mapping.
registerHooks({ resolve(specifier, context, nextResolve) {
  return nextResolve(specifier === './site-activity-daily' && context.parentURL?.endsWith('/lib/site-activity-events.ts')
    ? './site-activity-daily.ts' : specifier, context);
} });
const { activityEventKeys, createActivityEvent, trustedActivityIp, validActivityEventDate,
  recordActivityEvent, readActivityEvents, RECORD_ACTIVITY_EVENT_SCRIPT, READ_ACTIVITY_EVENTS_SCRIPT,
  SITE_ACTIVITY_EVENT_MAX_PER_DAY } = await import('../lib/site-activity-events.ts');

const now = new Date('2026-10-10T14:30:00Z');
const headers = new Headers({
  'x-vercel-forwarded-for': '203.0.113.7', 'x-forwarded-for': '198.51.100.99',
  'x-vercel-ip-country': 'CN', 'x-vercel-ip-country-region': 'HE', 'x-vercel-ip-city': '%E7%9F%B3%E5%AE%B6%E5%BA%84',
  'x-site-activity-page': '/wiki/CV/?q=must-not-store#private',
  'x-site-activity-referrer': 'https://google.com/search?q=must-not-store',
  'x-site-activity-event-id': '12345678-1234-1234-1234-123456789abc',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/140.0',
  cookie: 'private-cookie-value', authorization: 'Bearer private-credential-value',
  'x-vercel-ip-latitude': '38.12345',
});
const paths = new Set(['/', '/wiki/CV']);
const event = createActivityEvent(headers, true, 'xinbaopedia.top', paths, now);
assert.equal(event.ip, '203.0.113.7');
assert.equal(event.recordedAt, now.toISOString());
assert.equal(event.page, '/wiki/CV');
assert.equal(event.referrer, 'google.com');
assert.equal(event.city, '石家庄');
assert.equal(event.region, 'CN-HE');
assert.equal(event.id, '12345678-1234-1234-1234-123456789abc');
assert.doesNotMatch(JSON.stringify(event), /must-not-store|private-cookie|private-credential|38\.12345|198\.51\.100\.99/);
assert.equal(trustedActivityIp(headers, false), null, 'untrusted local headers never supply an IP');
headers.delete('x-vercel-forwarded-for');
assert.equal(trustedActivityIp(headers, true), null, 'generic forwarding header is never a fallback');
for (const value of ['not-an-ip', '203.0.113.7:1234', 'https://example.com', '1.2.3.999']) {
  headers.set('x-vercel-forwarded-for', value); assert.equal(trustedActivityIp(headers, true), null);
}
headers.set('x-vercel-forwarded-for', '2001:DB8::1');
assert.equal(trustedActivityIp(headers, true), '2001:db8::1');
assert.equal(createActivityEvent(headers, false, 'xinbaopedia.top', paths, now).city, null);
headers.set('x-site-activity-event-id', 'not-a-uuid');
assert.match(createActivityEvent(headers, false, 'xinbaopedia.top', paths, now).id, /^[a-f0-9-]{36}$/);
assert.equal(validActivityEventDate('2026-09-11', now), true);
for (const date of ['2026-09-10', '2026-10-11', '2026-02-30', 'bad']) assert.equal(validActivityEventDate(date, now), false);
assert.equal(validActivityEventDate('2026-09-11', new Date('2026-10-10T15:00:00Z')), false, 'retention follows Tokyo midnight');

// Model the Redis commands to exercise serialization, snapshot pagination,
// deduplication, fixed expiry and cap reporting. Real Lua is integration-tested
// separately when a local Redis runtime is available.
const lists = new Map(), hashes = new Map(), drops = new Map(), expiries = new Map();
const store = { async eval(script, keys, args) {
  if (script === RECORD_ACTIVITY_EVENT_SCRIPT) {
    const [rows, seen, dropped] = keys; const [id, json, expiry, cap] = args;
    const list = lists.get(rows) || []; const hash = hashes.get(seen) || new Set();
    if (hash.has(id)) return 0;
    if (list.length >= cap) { drops.set(dropped, (drops.get(dropped) || 0) + 1); expiries.set(dropped, expiry); return -1; }
    hash.add(id); list.push(json); lists.set(rows, list); hashes.set(seen, hash);
    expiries.set(rows, expiry); expiries.set(seen, expiry); return 1;
  }
  assert.equal(script, READ_ACTIVITY_EVENTS_SCRIPT);
  const list = lists.get(keys[0]) || []; const [requested, offset, limit] = args;
  const snapshot = requested < 0 ? list.length : requested;
  if (snapshot > list.length) return [-1];
  const last = snapshot - offset;
  const result = last > 0 ? list.slice(Math.max(0, last - limit), last).reverse() : [];
  return [list.length, snapshot, offset + result.length, drops.get(keys[1]) || 0, ...result];
} };
assert.equal(await recordActivityEvent(store, event, 'browser-a', 'test-only-secret'), 1);
assert.equal(await recordActivityEvent(store, event, 'browser-a', 'test-only-secret'), 0);
assert.equal(await recordActivityEvent(store, event, 'browser-b', 'test-only-secret'), 1, 'one browser cannot consume another browser event ID');
const keys = activityEventKeys('2026-10-10');
assert.equal(new Date(expiries.get(keys.rows) * 1000).toISOString(), '2026-11-08T15:00:00.000Z');
assert.equal([...hashes.get(keys.seen)].some(value => value.includes('browser-a')), false);
const first = await readActivityEvents(store, '2026-10-10', 1, 0, undefined, now);
assert.equal(first.totalStored, 2); assert.equal(first.nextOffset, 1); assert.equal(first.events[0].ip, event.ip);
await recordActivityEvent(store, { ...event, id: '12345678-1234-1234-1234-123456789abd', recordedAt: '2026-10-10T14:59:00Z' }, 'browser-a', 'test-only-secret');
const second = await readActivityEvents(store, '2026-10-10', 1, first.nextOffset, first.snapshot, now);
assert.equal(second.snapshot, 2); assert.equal(second.totalStored, 3); assert.equal(second.nextOffset, null);
assert.equal(second.events[0].id, event.id, 'concurrent append does not displace the frozen second page');
assert.equal(new Date(expiries.get(keys.rows) * 1000).toISOString(), '2026-11-08T15:00:00.000Z', 'late pings never extend retention');
for (const args of [['2026-09-10', 1, 0], ['2026-10-10', 201, 0], ['2026-10-10', 1, -1], ['2026-10-10', 1, 2, 1]]) {
  await assert.rejects(readActivityEvents(store, ...args, ...(args.length === 3 ? [undefined, now] : [now])));
}
await assert.rejects(readActivityEvents(store, '2026-10-10', 1, 0, 4, now), /snapshot unavailable/);
lists.set(keys.rows, Array(SITE_ACTIVITY_EVENT_MAX_PER_DAY).fill(JSON.stringify(event)));
assert.equal(await recordActivityEvent(store, { ...event, id: '12345678-1234-1234-1234-123456789abe' }, 'browser-a', 'test-only-secret'), -1);
const capped = await readActivityEvents(store, '2026-10-10', 1, 0, undefined, now);
assert.equal(capped.droppedPings, 1); assert.equal(capped.totalStored, SITE_ACTIVITY_EVENT_MAX_PER_DAY);
const empty = await readActivityEvents(store, '2026-10-09', 100, 0, undefined, now);
assert.deepEqual(empty.events, []); assert.equal(empty.nextOffset, null);
const route = fs.readFileSync('app/api/site-activity/route.ts', 'utf8');
const api = fs.readFileSync('app/api/site-activity/events/route.ts', 'utf8');
assert.ok(route.indexOf('if (!shouldRecordVisit(request))') < route.indexOf('await recordActivityEvent'));
assert.ok(route.indexOf('isSiteActivityBrowserExcluded(request.cookies') < route.indexOf('await recordActivityEvent'));
assert.ok(api.indexOf('if (!isActivityReportAuthorized') < api.indexOf('const redisUrl'));
assert.match(api, /private, no-store/); assert.match(api, /noindex, nofollow/);
assert.doesNotMatch(api, /Access-Control-Allow-Origin|searchParams\.get\('token'\)/);
console.log('private activity event validation, retention, deduplication, pagination, limits and exclusions passed');
