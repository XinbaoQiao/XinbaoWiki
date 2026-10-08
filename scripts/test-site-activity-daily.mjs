import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  activityDeviceLabels, dailyVisitLabels, isActivityReportAuthorized,
  normalizeActivityPage, normalizeActivityReferrer, readDailyActivity,
  recordDailyActivity, RECORD_DAILY_ACTIVITY_SCRIPT, siteActivityDailyKeys,
  siteActivityDateKey, siteActivityDateRange, SITE_ACTIVITY_DAILY_DIMENSIONS
} from '../lib/site-activity-daily.ts';

const paths = new Set(['/', '/wiki/Publications', '/wiki/CV']);
const headers = new Headers({
  'x-vercel-ip-country': 'CN', 'x-vercel-ip-country-region': 'GD',
  'x-vercel-ip-city': '%E6%B7%B1%E5%9C%B3',
  'x-site-activity-page': '/wiki/CV/?secret=never-store#private',
  'x-site-activity-referrer': 'https://www.google.com/search?q=private',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/140.0 Safari/537.36 Edg/140.0',
  'x-forwarded-for': '198.51.100.1', 'x-vercel-ip-latitude': '22.12345'
});
const labels = dailyVisitLabels(headers, true, 'xinbaopedia.top', paths);
assert.deepEqual(labels, {
  country: 'CN', region: 'CN-GD', city: '["CN","GD","深圳"]',
  page: '/wiki/CV', referrer: 'www.google.com', browser: 'Edge', os: 'Windows', device: 'desktop-or-other'
});
assert.equal(JSON.stringify(labels).includes('198.51.100.1'), false);
assert.equal(JSON.stringify(labels).includes('22.12345'), false);
assert.equal(JSON.stringify(labels).includes('private'), false);
assert.equal(JSON.stringify(labels).includes('never-store'), false);
const local = dailyVisitLabels(headers, false, 'xinbaopedia.top', paths);
assert.equal(local.country, 'unknown');
assert.equal(local.region, 'unknown');
assert.equal(local.city, 'unknown', 'untrusted local geography is ignored');
headers.set('x-vercel-ip-city', '%broken');
assert.equal(dailyVisitLabels(headers, true, 'xinbaopedia.top', paths).city, 'unknown');
headers.set('x-vercel-ip-city', '%00<script>');
assert.equal(dailyVisitLabels(headers, true, 'xinbaopedia.top', paths).city, 'unknown');
headers.set('x-vercel-ip-city', 'x'.repeat(500));
assert.equal(dailyVisitLabels(headers, true, 'xinbaopedia.top', paths).city, 'unknown');
headers.set('x-vercel-ip-country', 'not-a-country');
assert.equal(dailyVisitLabels(headers, true, 'xinbaopedia.top', paths).region, 'unknown');
headers.delete('x-site-activity-page');
headers.set('referer', 'https://xinbaopedia.top/wiki/Publications/?token=never-store');
assert.equal(dailyVisitLabels(headers, true, 'xinbaopedia.top', paths).page, '/wiki/Publications');
headers.set('referer', 'https://other.example/wiki/CV/');
assert.equal(dailyVisitLabels(headers, true, 'xinbaopedia.top', paths).page, 'unknown');
for (const path of ['/api/private', '//evil.example', '/wiki/Hidden_Page', '/arbitrary-email@example.com']) {
  assert.ok(['unknown', 'other'].includes(normalizeActivityPage(path, paths)), 'only public route labels enter storage');
}
for (const referrer of ['https://user:secret@google.com/', 'javascript:alert(1)', '127.0.0.1', 'localhost', 'broken host']) {
  assert.equal(normalizeActivityReferrer(referrer, 'xinbaopedia.top'), 'other');
}
assert.equal(normalizeActivityReferrer('https://xinbaopedia.top/wiki/CV/?a=secret', 'xinbaopedia.top'), 'internal');
assert.equal(normalizeActivityReferrer(null, 'xinbaopedia.top'), 'direct-or-unknown');
assert.deepEqual(activityDeviceLabels('Mozilla/5.0 (iPhone) Version/18.0 Mobile Safari/604.1'), { browser: 'Safari', os: 'iOS', device: 'mobile' });
assert.deepEqual(activityDeviceLabels('Mozilla/5.0 (Linux; Android 15; Tablet) Chrome/140.0'), { browser: 'Chrome', os: 'Android', device: 'tablet' });
assert.equal(activityDeviceLabels('Mozilla/5.0 (Macintosh) Firefox/140.0').browser, 'Firefox');
assert.equal(siteActivityDateKey(new Date('2026-10-07T15:00:00Z')), '2026-10-08');
assert.equal(siteActivityDateKey(new Date('2026-10-07T14:59:59Z')), '2026-10-07');
const now = new Date('2026-10-08T02:00:00Z');
assert.equal(siteActivityDateRange('2026-07-11', '2026-10-08', now)?.length, 90);
for (const [start, end] of [['2026-07-10', '2026-10-08'], ['2026-02-30', '2026-10-08'], ['2026-10-09', '2026-10-09'], ['2026-10-08', '2026-10-07']]) {
  assert.equal(siteActivityDateRange(start, end, now), null, 'invalid or expired date ranges are rejected');
}

const writes = [];
await recordDailyActivity({ eval: async (...args) => { writes.push(args); }, pipeline: () => { throw new Error('no separate mutations'); } }, 'hll-only-digest', labels, now);
await recordDailyActivity({ eval: async (...args) => { writes.push(args); }, pipeline: () => { throw new Error('no separate mutations'); } }, 'hll-only-digest', labels, new Date('2026-10-08T14:59:00Z'));
assert.equal(writes[0][0], RECORD_DAILY_ACTIVITY_SCRIPT);
assert.equal(writes[0][1].length, 10);
assert.equal(writes[0][2][1], writes[1][2][1], 'later visits cannot extend a day expiry');
assert.equal(new Date(Number(writes[0][2][1]) * 1000).toISOString(), '2027-01-05T15:00:00.000Z');
assert.deepEqual(writes[0][2].slice(3), SITE_ACTIVITY_DAILY_DIMENSIONS.map((dimension) => labels[dimension]));
assert.match(RECORD_DAILY_ACTIVITY_SCRIPT, /HEXISTS[\s\S]*HLEN[\s\S]*__other__/, 'cardinality admission and overflow run inside the atomic script');
assert.match(RECORD_DAILY_ACTIVITY_SCRIPT, /PFADD/);
assert.doesNotMatch(RECORD_DAILY_ACTIVITY_SCRIPT, /SADD|LPUSH|RPUSH|XADD/, 'no enumerable visitor identities or event rows');

assert.equal(isActivityReportAuthorized(new Headers({ authorization: 'Bearer test-admin-token' }), 'test-admin-token'), true);
for (const header of ['', 'Bearer wrong', 'Basic test-admin-token', 'Bearer test-admin-token extra']) {
  assert.equal(isActivityReportAuthorized(new Headers({ authorization: header }), 'test-admin-token'), false);
}
assert.equal(isActivityReportAuthorized(new Headers({ authorization: 'Bearer test-admin-token' }), undefined), false);
assert.equal(isActivityReportAuthorized(new Headers({ 'x-xinbao-chat-admin-token': 'test-admin-token' }), 'test-admin-token'), false);

// A small in-memory Redis read model demonstrates cross-day deduplication and
// independent marginal dimensions; report code cannot enumerate HLL identities.
const values = new Map();
const unique = new Map();
const dates = ['2026-10-07', '2026-10-08'];
for (const [index, date] of dates.entries()) {
  const keys = siteActivityDailyKeys(date);
  values.set(keys.views, index + 2);
  unique.set(keys.unique, new Set(index ? ['same', 'new'] : ['same']));
  values.set(keys.dimension('country'), { CN: index + 2 });
  values.set(keys.dimension('page'), index ? { '/wiki/CV': 3 } : { '/': 2 });
}
const batches = [];
const store = { pipeline() {
  const commands = [];
  const pipeline = {
    get(key) { commands.push(() => values.get(key) ?? null); },
    hgetall(key) { commands.push(() => values.get(key) ?? null); },
    pfcount(key, ...rest) { commands.push(() => new Set([key, ...rest].flatMap((item) => [...(unique.get(item) ?? [])])).size); },
    async exec() { batches.push(commands.length); return commands.map((command) => command()); }
  };
  return pipeline;
} };
const report = await readDailyActivity(store, dates);
assert.equal(report.pageViews, 5);
assert.equal(report.uniqueBrowsersEstimate, 2, 'range unique estimate is a union, not a sum of daily estimates');
assert.deepEqual(report.daily.map((day) => day.uniqueBrowsersEstimate), [1, 2]);
assert.deepEqual(report.dimensions.country, [{ label: 'CN', pageViews: 5 }]);
assert.deepEqual(report.dimensions.page, [{ label: '/wiki/CV', pageViews: 3 }, { label: '/', pageViews: 2 }]);
assert.equal(report.firstObservedDateInRange, '2026-10-07');
const emptyReport = await readDailyActivity(store, ['2026-10-06']);
assert.equal(emptyReport.firstObservedDateInRange, null);
assert.equal(emptyReport.pageViews, 0);
assert.equal(emptyReport.uniqueBrowsersEstimate, 0);
await readDailyActivity(store, siteActivityDateRange('2026-07-11', '2026-10-08', now));
assert.ok(batches.every((size) => size <= 70), 'REST pipelines stay bounded for a full 90-day report');
await assert.rejects(readDailyActivity(store, []));

const route = fs.readFileSync('app/api/site-activity/route.ts', 'utf8');
const summary = fs.readFileSync('app/api/site-activity/summary/route.ts', 'utf8');
const recorder = fs.readFileSync('components/SiteActivityRecorder.tsx', 'utf8');
assert.ok(route.indexOf('if (!shouldRecordVisit(request))') < route.indexOf('await recordDailyActivity'), 'automation exclusion precedes all daily writes');
assert.ok(route.indexOf('isSiteActivityBrowserExcluded(request.cookies') < route.indexOf('await recordDailyActivity'), 'maintainer exclusion precedes all daily writes');
assert.ok(summary.indexOf('if (!isActivityReportAuthorized') < summary.indexOf('const redisUrl'), 'authentication precedes all report storage access');
assert.match(summary, /private, no-store/);
assert.doesNotMatch(summary, /searchParams\.get\('(?:token|password)'\)|Access-Control-Allow-Origin/);
assert.match(recorder, /new URL\(document\.referrer\)\.hostname/);
assert.match(recorder, /pathname === lastPath\.current/);
assert.doesNotMatch(recorder, /localStorage|navigator\.geolocation|screen\.|userAgent/);
assert.equal(fs.readFileSync('components/VisitorAtlasDisclosure.tsx', 'utf8').includes('recordedRef'), false, 'homepage does not issue a second recording ping');
console.log('private daily activity, retention, metadata, auth, and report checks passed');
