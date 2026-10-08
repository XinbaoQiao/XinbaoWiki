import crypto from 'node:crypto';

export const SITE_ACTIVITY_DAILY_RETENTION_DAYS = 90;
export const SITE_ACTIVITY_DAILY_TIME_ZONE = 'Asia/Tokyo';
export const SITE_ACTIVITY_DAILY_PREFIX = 'xinbao-site-activity:daily:v1';
export const SITE_ACTIVITY_DAILY_DIMENSIONS = ['country', 'region', 'city', 'page', 'referrer', 'browser', 'os', 'device'] as const;
export const SITE_ACTIVITY_DAILY_MAX_LABELS = 256;
const DAY_MS = 86_400_000;
const TOKYO_OFFSET_MS = 9 * 60 * 60 * 1000;

type Dimension = typeof SITE_ACTIVITY_DAILY_DIMENSIONS[number];
export type DailyVisitLabels = Record<Dimension, string>;
type ReadPipeline = {
  get(key: string): unknown;
  hgetall(key: string): unknown;
  pfcount(key: string, ...keys: string[]): unknown;
  exec<T extends unknown[]>(): Promise<T>;
};
export type DailyActivityStore = {
  eval(script: string, keys: string[], args: (string | number)[]): Promise<unknown>;
  pipeline(): ReadPipeline;
};

export function siteActivityDateKey(now = new Date()) {
  return new Date(now.getTime() + TOKYO_OFFSET_MS).toISOString().slice(0, 10);
}

function dateStart(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NaN;
  const value = Date.parse(`${date}T00:00:00.000Z`);
  return Number.isFinite(value) && new Date(value).toISOString().slice(0, 10) === date ? value : NaN;
}

export function siteActivityDateRange(start: string, end: string, now = new Date()) {
  const first = dateStart(start);
  const last = dateStart(end);
  const today = dateStart(siteActivityDateKey(now));
  if (!Number.isFinite(first) || !Number.isFinite(last) || first > last || last > today || first < today - (SITE_ACTIVITY_DAILY_RETENTION_DAYS - 1) * DAY_MS) return null;
  return Array.from({ length: (last - first) / DAY_MS + 1 }, (_, index) => new Date(first + index * DAY_MS).toISOString().slice(0, 10));
}

export function siteActivityDailyKeys(date: string) {
  const prefix = `${SITE_ACTIVITY_DAILY_PREFIX}:${date}`;
  return { views: `${prefix}:views`, unique: `${prefix}:unique`, dimension: (dimension: Dimension) => `${prefix}:${dimension}` };
}

function cleanLabel(value: string | null, maximumBytes = 128) {
  if (!value || value.length > maximumBytes * 3) return '';
  try {
    const decoded = decodeURIComponent(value).normalize('NFC').trim().replace(/\s+/gu, ' ');
    return decoded && !/[\p{C}<>]/u.test(decoded) && Buffer.byteLength(decoded, 'utf8') <= maximumBytes ? decoded : '';
  } catch { return ''; }
}

export function normalizeActivityPage(value: string | null, publicPaths: ReadonlySet<string>) {
  if (!value || value.length > 256 || !value.startsWith('/') || value.startsWith('//')) return 'unknown';
  // Paths are selected from public routes, never saved from an arbitrary URL.
  const path = value.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
  return publicPaths.has(path) ? path : 'other';
}

export function normalizeActivityReferrer(value: string | null, ownHostname: string) {
  if (!value) return 'direct-or-unknown';
  if (value.length > 2048) return 'other';
  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return 'other';
    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
    if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(hostname) || hostname.length > 253) return 'other';
    return hostname === ownHostname ? 'internal' : hostname;
  } catch { return 'other'; }
}

export function activityDeviceLabels(userAgent: string | null) {
  const ua = (userAgent || '').slice(0, 1024);
  const browser = /Edg(?:e|A|iOS)?\//.test(ua) ? 'Edge' : /(?:OPR|Opera)\//.test(ua) ? 'Opera' : /(?:Firefox|FxiOS)\//.test(ua) ? 'Firefox' : /(?:Chrome|CriOS)\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Other';
  const os = /Android/.test(ua) ? 'Android' : /(?:iPhone|iPad|iPod)/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /CrOS/.test(ua) ? 'ChromeOS' : /Macintosh|Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Other';
  const device = /iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua)) ? 'tablet' : /Mobile|iPhone|iPod/.test(ua) ? 'mobile' : ua ? 'desktop-or-other' : 'unknown';
  return { browser, os, device };
}

export function dailyVisitLabels(headers: Headers, vercel: boolean, ownHostname: string, publicPaths: ReadonlySet<string>): DailyVisitLabels {
  const code = vercel ? (headers.get('x-vercel-ip-country') || '').toUpperCase() : '';
  const country = /^[A-Z]{2}$/.test(code) ? code : 'unknown';
  const rawRegion = vercel ? (headers.get('x-vercel-ip-country-region') || '').toUpperCase() : '';
  const regionCode = /^[A-Z0-9]{1,3}$/.test(rawRegion) ? rawRegion : '';
  const city = vercel ? cleanLabel(headers.get('x-vercel-ip-city')) : '';
  let page = headers.get('x-site-activity-page');
  if (!page) {
    try {
      const referer = new URL(headers.get('referer') || '');
      if (referer.hostname === ownHostname) page = referer.pathname;
    } catch { /* Older clients can record a visit without a known page. */ }
  }
  return {
    country,
    region: country !== 'unknown' && regionCode ? `${country}-${regionCode}` : 'unknown',
    city: country !== 'unknown' && city ? JSON.stringify([country, regionCode, city]) : 'unknown',
    page: normalizeActivityPage(page, publicPaths),
    referrer: normalizeActivityReferrer(headers.get('x-site-activity-referrer'), ownHostname),
    ...activityDeviceLabels(headers.get('user-agent'))
  };
}

// A single atomic script bounds dimension cardinality and assigns every key a
// fixed expiry. Late writes never prolong the retention window of an old day.
export const RECORD_DAILY_ACTIVITY_SCRIPT = `
redis.call('INCR', KEYS[1])
redis.call('PFADD', KEYS[2], ARGV[1])
redis.call('EXPIREAT', KEYS[1], ARGV[2])
redis.call('EXPIREAT', KEYS[2], ARGV[2])
for i = 3, #KEYS do
  local label = ARGV[i + 1]
  if redis.call('HEXISTS', KEYS[i], label) == 0 and redis.call('HLEN', KEYS[i]) >= tonumber(ARGV[3]) then
    label = '__other__'
  end
  redis.call('HINCRBY', KEYS[i], label, 1)
  redis.call('EXPIREAT', KEYS[i], ARGV[2])
end
return 1
`;

export async function recordDailyActivity(store: DailyActivityStore, digest: string, labels: DailyVisitLabels, now = new Date()) {
  const date = siteActivityDateKey(now);
  const keys = siteActivityDailyKeys(date);
  const expiry = Math.floor((dateStart(date) - TOKYO_OFFSET_MS + SITE_ACTIVITY_DAILY_RETENTION_DAYS * DAY_MS) / 1000);
  await store.eval(RECORD_DAILY_ACTIVITY_SCRIPT,
    [keys.views, keys.unique, ...SITE_ACTIVITY_DAILY_DIMENSIONS.map((dimension) => keys.dimension(dimension))],
    [digest, expiry, SITE_ACTIVITY_DAILY_MAX_LABELS, ...SITE_ACTIVITY_DAILY_DIMENSIONS.map((dimension) => labels[dimension])]);
}

export function isActivityReportAuthorized(headers: Headers, expected: string | undefined) {
  if (!expected) return false;
  const provided = headers.get('authorization')?.match(/^Bearer\s+([^\s]+)$/i)?.[1];
  if (!provided || provided.length > 512) return false;
  const digest = (value: string) => crypto.createHash('sha256').update(value).digest();
  return crypto.timingSafeEqual(digest(provided), digest(expected));
}

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export async function readDailyActivity(store: DailyActivityStore, dates: string[]) {
  if (!dates.length || dates.length > SITE_ACTIVITY_DAILY_RETENTION_DAYS || dates.some((date) => !Number.isFinite(dateStart(date)))) throw new Error('Invalid report range');
  const totals = Object.fromEntries(SITE_ACTIVITY_DAILY_DIMENSIONS.map((dimension) => [dimension, new Map<string, number>()])) as Record<Dimension, Map<string, number>>;
  const daily: Array<{ date: string; pageViews: number; uniqueBrowsersEstimate: number }> = [];
  // Bound each REST pipeline even for a full 90-day report.
  for (let offset = 0; offset < dates.length; offset += 7) {
    const batch = dates.slice(offset, offset + 7);
    const pipeline = store.pipeline();
    for (const date of batch) {
      const keys = siteActivityDailyKeys(date);
      pipeline.get(keys.views);
      pipeline.pfcount(keys.unique);
      for (const dimension of SITE_ACTIVITY_DAILY_DIMENSIONS) pipeline.hgetall(keys.dimension(dimension));
    }
    const results = await pipeline.exec<unknown[]>();
    batch.forEach((date, index) => {
      const base = index * (SITE_ACTIVITY_DAILY_DIMENSIONS.length + 2);
      daily.push({ date, pageViews: number(results[base]), uniqueBrowsersEstimate: number(results[base + 1]) });
      SITE_ACTIVITY_DAILY_DIMENSIONS.forEach((dimension, position) => {
        const raw = results[base + 2 + position];
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
        for (const [label, count] of Object.entries(raw)) totals[dimension].set(label, (totals[dimension].get(label) || 0) + number(count));
      });
    });
  }
  const union = store.pipeline();
  const [first, ...rest] = dates.map((date) => siteActivityDailyKeys(date).unique);
  union.pfcount(first, ...rest);
  const [unique] = await union.exec<unknown[]>();
  return {
    timeZone: SITE_ACTIVITY_DAILY_TIME_ZONE,
    retentionDays: SITE_ACTIVITY_DAILY_RETENTION_DAYS,
    period: { start: dates[0], end: dates.at(-1) },
    firstObservedDateInRange: daily.find((day) => day.pageViews > 0)?.date || null,
    pageViews: daily.reduce((sum, day) => sum + day.pageViews, 0),
    uniqueBrowsersEstimate: number(unique),
    daily,
    dimensions: Object.fromEntries(SITE_ACTIVITY_DAILY_DIMENSIONS.map((dimension) => [dimension,
      [...totals[dimension]].map(([label, pageViews]) => ({ label, pageViews })).sort((left, right) => right.pageViews - left.pageViews || left.label.localeCompare(right.label))
    ]))
  };
}
