import crypto from 'node:crypto';
import { isIP } from 'node:net';
import { dailyVisitLabels, siteActivityDateKey, type DailyVisitLabels } from './site-activity-daily';

export const SITE_ACTIVITY_EVENT_RETENTION_DAYS = 30;
export const SITE_ACTIVITY_EVENT_MAX_PER_DAY = 2_000;
const PREFIX = 'xinbao-site-activity:events:v1';
const DAY_MS = 86_400_000;
const TOKYO_OFFSET_MS = 9 * 60 * 60 * 1000;

export type ActivityEvent = {
  id: string;
  recordedAt: string;
  ip: string | null;
  country: string;
  region: string;
  city: string | null;
  page: string;
  referrer: string;
  browser: string;
  os: string;
  device: string;
};
export type ActivityEventStore = {
  eval(script: string, keys: string[], args: (string | number)[]): Promise<unknown>;
};

export function trustedActivityIp(headers: Headers, vercel: boolean) {
  if (!vercel) return null;
  const value = headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim();
  return value && value.length <= 45 && isIP(value) ? value.toLowerCase() : null;
}

export function activityEventKeys(date: string) {
  return { rows: `${PREFIX}:${date}:rows`, seen: `${PREFIX}:${date}:seen`, dropped: `${PREFIX}:${date}:dropped` };
}

export function validActivityEventDate(date: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const value = Date.parse(`${date}T00:00:00Z`);
  const today = Date.parse(`${siteActivityDateKey(now)}T00:00:00Z`);
  return Number.isFinite(value) && new Date(value).toISOString().slice(0, 10) === date
    && value <= today && value >= today - (SITE_ACTIVITY_EVENT_RETENTION_DAYS - 1) * DAY_MS;
}

export function createActivityEvent(headers: Headers, vercel: boolean, ownHostname: string, paths: ReadonlySet<string>, now = new Date()): ActivityEvent {
  const labels: DailyVisitLabels = dailyVisitLabels(headers, vercel, ownHostname, paths);
  const supplied = headers.get('x-site-activity-event-id') || '';
  const id = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(supplied) ? supplied.toLowerCase() : crypto.randomUUID();
  const city = labels.city === 'unknown' ? null : (JSON.parse(labels.city) as string[])[2];
  return { id, recordedAt: now.toISOString(), ip: trustedActivityIp(headers, vercel), ...labels, city };
}

// Fixed daily expiry, bounded storage, and browser-scoped event deduplication.
// No cookie identifier or stable browser digest is saved with an event.
export const RECORD_ACTIVITY_EVENT_SCRIPT = `
if redis.call('HEXISTS', KEYS[2], ARGV[1]) == 1 then return 0 end
if redis.call('LLEN', KEYS[1]) >= tonumber(ARGV[4]) then
  redis.call('INCR', KEYS[3])
  redis.call('EXPIREAT', KEYS[3], ARGV[3])
  return -1
end
redis.call('HSET', KEYS[2], ARGV[1], '1')
redis.call('RPUSH', KEYS[1], ARGV[2])
redis.call('EXPIREAT', KEYS[1], ARGV[3])
redis.call('EXPIREAT', KEYS[2], ARGV[3])
return 1
`;

export async function recordActivityEvent(store: ActivityEventStore, event: ActivityEvent, visitorDigest: string, secret: string) {
  const now = new Date(event.recordedAt);
  const date = siteActivityDateKey(now);
  const keys = activityEventKeys(date);
  const expiry = Math.floor((Date.parse(`${date}T00:00:00Z`) - TOKYO_OFFSET_MS + SITE_ACTIVITY_EVENT_RETENTION_DAYS * DAY_MS) / 1000);
  const dedup = crypto.createHmac('sha256', secret).update(`activity-event:${visitorDigest}:${event.id}`).digest('hex');
  return store.eval(RECORD_ACTIVITY_EVENT_SCRIPT, [keys.rows, keys.seen, keys.dropped],
    [dedup, JSON.stringify(event), expiry, SITE_ACTIVITY_EVENT_MAX_PER_DAY]);
}

// Reads and fixes the snapshot atomically. Appends do not shift later pages;
// an expired snapshot is rejected instead of silently skipping records.
export const READ_ACTIVITY_EVENTS_SCRIPT = `
local total = redis.call('LLEN', KEYS[1])
local snapshot = tonumber(ARGV[1])
if snapshot < 0 then snapshot = total end
if snapshot > total then return {-1} end
local offset = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local last = snapshot - offset - 1
local first = math.max(0, last - limit + 1)
local rows = {}
if last >= 0 then rows = redis.call('LRANGE', KEYS[1], first, last) end
local result = {total, snapshot, offset + #rows, tonumber(redis.call('GET', KEYS[2]) or '0')}
for i = #rows, 1, -1 do table.insert(result, rows[i]) end
return result
`;

export async function readActivityEvents(store: ActivityEventStore, date: string, limit: number, offset: number, snapshot?: number, now = new Date()) {
  if (!validActivityEventDate(date, now) || !Number.isInteger(limit) || limit < 1 || limit > 200
    || !Number.isInteger(offset) || offset < 0 || offset > SITE_ACTIVITY_EVENT_MAX_PER_DAY
    || (snapshot !== undefined && (!Number.isInteger(snapshot) || snapshot < offset || snapshot > SITE_ACTIVITY_EVENT_MAX_PER_DAY))) {
    throw new Error('Invalid event range');
  }
  const keys = activityEventKeys(date);
  const raw = await store.eval(READ_ACTIVITY_EVENTS_SCRIPT, [keys.rows, keys.dropped], [snapshot ?? -1, offset, limit]);
  if (!Array.isArray(raw) || raw.length < 4) throw new Error('Event snapshot unavailable');
  const [total, frozen, next, dropped, ...rows] = raw;
  const events = rows.map(row => typeof row === 'string' ? JSON.parse(row) as ActivityEvent : row as ActivityEvent);
  return { date, timeZone: 'Asia/Tokyo', retentionDays: SITE_ACTIVITY_EVENT_RETENTION_DAYS, order: 'newest-recorded-first',
    totalStored: Number(total), snapshot: Number(frozen), offset, limit, droppedPings: Number(dropped),
    nextOffset: Number(next) < Number(frozen) ? Number(next) : null, events };
}
