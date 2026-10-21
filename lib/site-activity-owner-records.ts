import crypto from 'node:crypto';
import { activityDeviceLabels, dailyVisitLabels, siteActivityDateKey } from './site-activity-daily';
import { READ_ACTIVITY_EVENTS_SCRIPT, trustedActivityIp, validActivityEventDate, type ActivityEventStore } from './site-activity-events';

export const OWNER_RECORD_MAX_PER_DAY = 200;
export const OWNER_RECORD_RETENTION_DAYS = 30;
const PREFIX = 'site-activity:owner-actions:v1';

export function ownerNetworkContext(headers: Headers, vercel: boolean) {
  const labels = dailyVisitLabels(headers, vercel, 'example.com', new Set());
  return {
    ip: trustedActivityIp(headers, vercel), country: labels.country, region: labels.region,
    city: labels.city === 'unknown' ? null : (JSON.parse(labels.city) as string[])[2],
    ...activityDeviceLabels(headers.get('user-agent'))
  };
}

export type OwnerActionRecord = ReturnType<typeof ownerNetworkContext> & {
  id: string; recordedAt: string; action: 'exclude' | 'include';
};

export function ownerActionKeys(date: string) {
  return { rows: `${PREFIX}:${date}:rows`, dropped: `${PREFIX}:${date}:dropped` };
}

export const RECORD_OWNER_ACTION_SCRIPT = `
if redis.call('LLEN', KEYS[1]) >= tonumber(ARGV[3]) then
  redis.call('INCR', KEYS[2])
  redis.call('EXPIREAT', KEYS[2], ARGV[2])
  return 0
end
redis.call('RPUSH', KEYS[1], ARGV[1])
redis.call('EXPIREAT', KEYS[1], ARGV[2])
return 1
`;

// Only successful password-verified actions reach this writer. No browser ID,
// cookie, password, full user agent, page or referrer enters the audit record.
export async function recordOwnerAction(store: ActivityEventStore, headers: Headers, vercel: boolean, excluded: boolean, now = new Date()) {
  const record: OwnerActionRecord = {
    id: crypto.randomUUID(), recordedAt: now.toISOString(), action: excluded ? 'exclude' : 'include',
    ...ownerNetworkContext(headers, vercel)
  };
  const date = siteActivityDateKey(now);
  const keys = ownerActionKeys(date);
  const expiry = (Date.parse(`${date}T00:00:00Z`) - 9 * 3_600_000 + OWNER_RECORD_RETENTION_DAYS * 86_400_000) / 1000;
  const saved = Number(await store.eval(RECORD_OWNER_ACTION_SCRIPT, [keys.rows, keys.dropped],
    [JSON.stringify(record), expiry, OWNER_RECORD_MAX_PER_DAY])) === 1;
  return { record, saved };
}

export async function readOwnerActions(store: ActivityEventStore, date: string, limit: number, offset: number, snapshot?: number, now = new Date()) {
  if (!validActivityEventDate(date, now) || !Number.isInteger(limit) || limit < 1 || limit > 200
    || !Number.isInteger(offset) || offset < 0 || offset > OWNER_RECORD_MAX_PER_DAY
    || (snapshot !== undefined && (!Number.isInteger(snapshot) || snapshot < offset || snapshot > OWNER_RECORD_MAX_PER_DAY))) {
    throw new Error('Invalid owner action range');
  }
  const keys = ownerActionKeys(date);
  const raw = await store.eval(READ_ACTIVITY_EVENTS_SCRIPT, [keys.rows, keys.dropped], [snapshot ?? -1, offset, limit]);
  if (!Array.isArray(raw) || raw.length < 4) throw new Error('Owner action snapshot unavailable');
  const [total, frozen, next, dropped, ...rows] = raw;
  return {
    date, timeZone: 'Asia/Tokyo', retentionDays: OWNER_RECORD_RETENTION_DAYS, order: 'newest-recorded-first',
    totalStored: Number(total), snapshot: Number(frozen), offset, limit, droppedActions: Number(dropped),
    nextOffset: Number(next) < Number(frozen) ? Number(next) : null,
    actions: rows.map(row => typeof row === 'string' ? JSON.parse(row) as OwnerActionRecord : row as OwnerActionRecord)
  };
}
