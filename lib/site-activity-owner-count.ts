import crypto from 'node:crypto';
import type { ActivityEventStore } from './site-activity-events';

// Owner-confirmed identities only, separate from IP/action records. Keep this
// small correction registry for as long as the lifetime aggregate it corrects.
export const OWNER_COUNT_KEY = 'xinbao-site-activity:v2:owner-count-corrections';
export const OWNER_COUNT_STATE_KEY = 'xinbao-site-activity:v2:owner-count-states';
export const OWNER_COUNT_LIMIT = 200;

export function existingCountedBrowser(value: string | undefined, salt: string) {
  const parts = (value || '').split('.');
  // A v2 cookie is issued only after the lifetime aggregation succeeds.
  // Legacy, missing and forged cookies do not prove a previously counted ID.
  if (parts.length !== 3 || parts[0] !== 'v2' || !/^[a-f0-9-]{36}$/i.test(parts[1]) || !/^[a-f0-9]{32}$/.test(parts[2])) return null;
  const signature = crypto.createHmac('sha256', salt).update(`site-activity-cookie:${parts[1]}`).digest('hex').slice(0, 32);
  if (!crypto.timingSafeEqual(Buffer.from(parts[2], 'hex'), Buffer.from(signature, 'hex'))) return null;
  return crypto.createHmac('sha256', salt).update(`site-activity-hll:${parts[1]}`).digest('hex');
}

export const UPDATE_OWNER_COUNT_SCRIPT = `
local state = redis.call('HGET', KEYS[2], ARGV[1])
if ARGV[2] == 'auto' and state == 'include' then return 2 end
if not state and redis.call('HLEN', KEYS[2]) >= tonumber(ARGV[3]) then return -1 end
if ARGV[2] == 'include' then
  redis.call('HSET', KEYS[2], ARGV[1], 'include')
  redis.call('SREM', KEYS[1], ARGV[1])
  return 2
end
redis.call('HSET', KEYS[2], ARGV[1], 'exclude')
return redis.call('SADD', KEYS[1], ARGV[1])
`;

export type OwnerCountStatus = 'registered' | 'restored' | 'not-registered' | 'identity-unavailable' | 'unavailable';

export async function readOwnerCountStatus(store: ActivityEventStore, cookie: string | undefined, salt: string): Promise<OwnerCountStatus> {
  const digest = existingCountedBrowser(cookie, salt);
  if (!digest) return 'identity-unavailable';
  return Number(await store.eval("return redis.call('SISMEMBER', KEYS[1], ARGV[1])", [OWNER_COUNT_KEY], [digest])) === 1 ? 'registered' : 'not-registered';
}

export async function updateOwnerCount(store: ActivityEventStore, cookie: string | undefined, salt: string, excluded: boolean, automatic = false): Promise<OwnerCountStatus> {
  const digest = existingCountedBrowser(cookie, salt);
  if (!digest) return 'identity-unavailable';
  const result = Number(await store.eval(UPDATE_OWNER_COUNT_SCRIPT, [OWNER_COUNT_KEY, OWNER_COUNT_STATE_KEY],
    [digest, automatic ? 'auto' : excluded ? 'exclude' : 'include', OWNER_COUNT_LIMIT]));
  if (result < 0) return 'unavailable';
  return result === 2 ? 'restored' : 'registered';
}

export function ownerAdjustedEstimate(raw: number, owners: number) {
  if (!Number.isInteger(raw) || raw < 0 || !Number.isInteger(owners) || owners < 0 || owners > OWNER_COUNT_LIMIT) throw new Error('Invalid owner count correction');
  return Math.max(0, raw - owners);
}
