import crypto from 'node:crypto';
import { isIP } from 'node:net';

export const CHAT_AUDIT_RETENTION_DAYS = 365;
export const CHAT_AUDIT_MAX_PER_DAY = 2_000;
export const CHAT_AUDIT_REJECTED_MAX_PER_DAY = 500;
export const CHAT_AUDIT_QUESTION_LIMIT = 1_000;
export const CHAT_AUDIT_REPLY_LIMIT = 6_000;
const PREFIX = 'site-chat:audit:v1';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ChatAuditKind = 'accepted' | 'rejected';
export type ChatAuditAttempt = {
  number: number; startedAt: string; budgetDate?: string; finishedAt?: string; status?: number;
  outcome: 'started' | 'ok' | 'upstream-error' | 'empty' | 'request-error';
  promptTokens?: number; completionTokens?: number; totalTokens?: number;
  usageReported: boolean;
};
export type ChatAuditEvent = {
  schemaVersion: 1; id: string; createdAt: string; dateKey: string; completedAt?: string;
  kind: ChatAuditKind; state: 'started' | 'completed'; outcome: string; status: number | null;
  conversationId: string | null; ip: string | null; country: string | null; region: string | null;
  city: string | null; userAgent: string; maintenance: boolean; pagePath: string;
  language: string; question: string; questionTruncated: boolean; reply: string; replyTruncated: boolean;
  visitorHash: string; browserHash: string; ipHash: string; model: string; provider: string;
  promptVersion: string; indexVersion: string; indexFingerprint: string; sourceSlugs: string[]; sourceChunkIds: string[]; responseMode: string;
  attempts: ChatAuditAttempt[]; providerAttempts: number; promptTokens: number | null;
  completionTokens: number | null; totalTokens: number | null; usageComplete: boolean;
  durationMs: number; retryReason?: string; retryOutcome?: string; finalValidationFailure?: string;
  upstreamStatus?: number;
};
export interface ChatAuditStore {
  eval(script: string, keys: string[], args: Array<string | number>): Promise<unknown>;
}

export class ChatProviderBudgetExceeded extends Error {}

export function chatProviderAttemptLimit() {
  const raw = process.env.CHAT_DAILY_PROVIDER_ATTEMPT_LIMIT;
  if (raw === undefined || raw === '') return 200;
  const value = Number(raw);
  // Invalid configuration disables paid calls rather than silently removing the ceiling.
  return Number.isInteger(value) && value >= 0 && value <= 4_000 ? value : 0;
}

export function chatAuditDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function chatAuditExpiration(date: string) {
  return Math.floor((Date.parse(`${date}T00:00:00+09:00`) + CHAT_AUDIT_RETENTION_DAYS * 86_400_000) / 1_000);
}

export function validChatAuditDate(date: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = Date.parse(`${date}T12:00:00Z`);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString().slice(0, 10) !== date) return false;
  const today = chatAuditDate(now);
  const earliest = new Date(Date.parse(`${today}T12:00:00Z`) - (CHAT_AUDIT_RETENTION_DAYS - 1) * 86_400_000).toISOString().slice(0, 10);
  return date >= earliest && date <= today;
}

export function chatAuditKeys(date: string, kind: ChatAuditKind = 'accepted') {
  const base = `${PREFIX}:${date}`;
  return { ids: `${base}:${kind}:ids`, rows: `${base}:${kind}:rows`, stats: `${base}:${kind}:stats`, budget: `${base}:provider-attempts`, attemptRefs: `${base}:provider-attempt-refs`, attemptSeen: `${base}:provider-attempt-seen` };
}

export function trustedChatAuditIp(headers: Headers, vercel = process.env.VERCEL === '1') {
  if (!vercel) return null;
  const value = headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || '';
  return isIP(value) ? value.toLowerCase() : null;
}

export function auditText(value: unknown, max: number) {
  let text = typeof value === 'string' ? value : '';
  // This private store still must never retain server credentials or a pasted credential-shaped value.
  for (const name of ['YUNWU_API_KEY', 'UPSTASH_REDIS_REST_TOKEN', 'RATE_LIMIT_SALT', 'SITE_CHAT_ADMIN_TOKEN', 'AUTHENTICATION_TOKEN', 'SITE_ACTIVITY_OWNER_PASSWORD_HASH', 'SITE_CHAT_VOICE_STYLE']) {
    const secret = process.env[name];
    if (secret && secret.length >= 8) text = text.split(secret).join('[redacted]');
  }
  text = text.replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g, '[redacted private key]')
    .replace(/\bBearer\s+[^\s"'<>]+/gi, 'Bearer [redacted]')
    .replace(/\bsk-[A-Za-z0-9_-]{12,}/g, '[redacted]')
    .replace(/\b(?:gh[pousr]_|github_pat_|glpat-|AIza|hf_|npm_|whsec_)[A-Za-z0-9_-]{16,}/g, '[redacted]')
    .replace(/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g, '[redacted]')
    .replace(/\bxox[baprs]-[A-Za-z0-9-]{10,}/g, '[redacted]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[redacted]')
    .replace(/["']?\b(api[_ -]?key|access[_ -]?token|refresh[_ -]?token|client[_ -]?secret|password|authorization|token|secret|credential)["']?\s*[:=]\s*(?:"[^"\n]*"|'[^'\n]*'|[^\s,;}]+)/gi, '$1=[redacted]')
    .replace(/\b[A-Za-z0-9_+/=-]{40,}\b/g, value => /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) ? '[redacted opaque value]' : value);
  return { text: text.slice(0, max), truncated: text.length > max };
}

function geo(headers: Headers, name: string, max: number, vercel: boolean) {
  if (!vercel) return null;
  let value = headers.get(name) || '';
  try { value = decodeURIComponent(value); } catch { return null; }
  return value && !/[\u0000-\u001f\u007f]/.test(value) ? auditText(value, max).text : null;
}

export function createChatAuditEvent(headers: Headers, options: {
  id?: string; now?: Date; kind?: ChatAuditKind; message?: string; language?: string;
  conversationId?: unknown; pagePath?: string; identity?: { visitorHash: string; browserHash: string; ipHash: string } | null;
  model?: string; provider?: string; promptVersion?: string; indexVersion?: string; indexFingerprint?: string;
  sourceSlugs?: string[]; sourceChunkIds?: string[]; responseMode?: string; vercel?: boolean;
} = {}): ChatAuditEvent {
  const now = options.now ?? new Date();
  const vercel = options.vercel ?? process.env.VERCEL === '1';
  const question = auditText(options.message, CHAT_AUDIT_QUESTION_LIMIT);
  const userAgent = auditText(headers.get('user-agent'), 512).text;
  return {
    schemaVersion: 1, id: options.id && UUID.test(options.id) ? options.id : crypto.randomUUID(),
    createdAt: now.toISOString(), dateKey: chatAuditDate(now), kind: options.kind ?? 'accepted',
    state: 'started', outcome: 'started', status: null,
    conversationId: typeof options.conversationId === 'string' && UUID.test(options.conversationId) ? options.conversationId.toLowerCase() : null,
    ip: trustedChatAuditIp(headers, vercel), country: geo(headers, 'x-vercel-ip-country', 2, vercel),
    region: geo(headers, 'x-vercel-ip-country-region', 32, vercel), city: geo(headers, 'x-vercel-ip-city', 100, vercel),
    userAgent, maintenance: /mywiki-|HeadlessChrome|Playwright|Puppeteer/i.test(userAgent),
    pagePath: auditText((options.pagePath || '').split(/[?#]/)[0], 180).text,
    language: options.language === 'zh' ? 'zh' : 'en', question: question.text, questionTruncated: question.truncated,
    reply: '', replyTruncated: false, visitorHash: options.identity?.visitorHash || '',
    browserHash: options.identity?.browserHash || '', ipHash: options.identity?.ipHash || '',
    model: options.model || '', provider: options.provider || '', promptVersion: options.promptVersion || '',
    indexVersion: options.indexVersion || '', indexFingerprint: options.indexFingerprint || '',
    sourceSlugs: (options.sourceSlugs || []).slice(0, 20), sourceChunkIds: (options.sourceChunkIds || []).slice(0, 20),
    responseMode: options.responseMode || '', attempts: [], providerAttempts: 0,
    promptTokens: null, completionTokens: null, totalTokens: null, usageComplete: true, durationMs: 0,
  };
}

export function completeChatAuditEvent(event: ChatAuditEvent, details: {
  outcome: string; status: number; reply?: string; durationMs?: number;
  retryReason?: string; retryOutcome?: string; finalValidationFailure?: string; upstreamStatus?: number;
}, now = new Date()) {
  const reply = auditText(details.reply, CHAT_AUDIT_REPLY_LIMIT);
  const sum = (field: 'promptTokens' | 'completionTokens' | 'totalTokens') => {
    if (event.attempts.length === 0) return 0;
    const values = event.attempts.map(attempt => attempt[field]).filter((value): value is number => value !== undefined);
    return values.length ? values.reduce((total, value) => total + value, 0) : null;
  };
  Object.assign(event, details, { state: 'completed', completedAt: now.toISOString(), reply: reply.text,
    replyTruncated: reply.truncated, durationMs: details.durationMs ?? Math.max(0, now.getTime() - Date.parse(event.createdAt)),
    providerAttempts: event.attempts.length, promptTokens: sum('promptTokens'), completionTokens: sum('completionTokens'),
    totalTokens: sum('totalTokens'), usageComplete: event.attempts.every(attempt => attempt.usageReported),
  });
  return event;
}

// Append-only admission order, bounded independently for accepted and rejected requests.
// No LTRIM: reaching the cap must not silently erase paid-call evidence.
export const START_CHAT_AUDIT_SCRIPT = `
if redis.call('HEXISTS', KEYS[2], ARGV[1]) == 1 then return 1 end
if redis.call('LLEN', KEYS[1]) >= tonumber(ARGV[4]) then
  redis.call('HINCRBY', KEYS[3], 'dropped', 1)
  redis.call('EXPIREAT', KEYS[3], ARGV[3])
  return 0
end
redis.call('HSET', KEYS[2], ARGV[1], ARGV[2])
redis.call('RPUSH', KEYS[1], ARGV[1])
redis.call('HINCRBY', KEYS[3], 'admitted', 1)
for i=1,3 do redis.call('EXPIREAT', KEYS[i], ARGV[3]) end
return 1`;

export const FINISH_CHAT_AUDIT_SCRIPT = `
if redis.call('HEXISTS', KEYS[1], ARGV[1]) ~= 1 then return 0 end
redis.call('HSET', KEYS[1], ARGV[1], ARGV[2])
redis.call('EXPIREAT', KEYS[1], ARGV[3])
return 1`;

// Reserve the provider attempt and persist its admission in one Redis operation.
// Failed, cancelled and retried upstream attempts are never refunded from this site-wide ceiling.
export const RESERVE_CHAT_PROVIDER_SCRIPT = `
if redis.call('HEXISTS', KEYS[2], ARGV[1]) ~= 1 then return -1 end
if redis.call('HEXISTS', KEYS[4], ARGV[7]) == 1 then return 1 end
local count = tonumber(redis.call('GET', KEYS[1]) or '0')
if count >= tonumber(ARGV[3]) then return 0 end
redis.call('INCR', KEYS[1])
redis.call('EXPIREAT', KEYS[1], ARGV[4])
redis.call('HSET', KEYS[2], ARGV[1], ARGV[2])
redis.call('EXPIREAT', KEYS[2], ARGV[5])
redis.call('RPUSH', KEYS[3], ARGV[6])
redis.call('EXPIREAT', KEYS[3], ARGV[4])
redis.call('HSET', KEYS[4], ARGV[7], '1')
redis.call('EXPIREAT', KEYS[4], ARGV[4])
return 1`;

export const READ_CHAT_AUDIT_SCRIPT = `
local total = redis.call('LLEN', KEYS[1])
local snapshot = tonumber(ARGV[1])
if snapshot < 0 then snapshot = total end
if snapshot > total then return {-1} end
local offset = tonumber(ARGV[2])
local last = snapshot - offset - 1
local first = math.max(0, last - tonumber(ARGV[3]) + 1)
local ids = {}
if last >= 0 then ids = redis.call('LRANGE', KEYS[1], first, last) end
local refs = redis.call('LRANGE', KEYS[5], 0, 3999)
local result = {total, snapshot, offset + #ids, tonumber(redis.call('HGET', KEYS[3], 'dropped') or '0'), tonumber(redis.call('GET', KEYS[4]) or '0'), refs}
for i=#ids,1,-1 do
  local row = redis.call('HGET', KEYS[2], ids[i])
  if not row then return {-1} end
  table.insert(result, row)
end
return result`;

export async function startChatAudit(store: ChatAuditStore, event: ChatAuditEvent) {
  const keys = chatAuditKeys(event.dateKey, event.kind);
  return Number(await store.eval(START_CHAT_AUDIT_SCRIPT, [keys.ids, keys.rows, keys.stats], [event.id, JSON.stringify(event), chatAuditExpiration(event.dateKey), event.kind === 'accepted' ? CHAT_AUDIT_MAX_PER_DAY : CHAT_AUDIT_REJECTED_MAX_PER_DAY])) === 1;
}

export async function finishChatAudit(store: ChatAuditStore, event: ChatAuditEvent) {
  const keys = chatAuditKeys(event.dateKey, event.kind);
  if (Number(await store.eval(FINISH_CHAT_AUDIT_SCRIPT, [keys.rows], [event.id, JSON.stringify(event), chatAuditExpiration(event.dateKey)])) !== 1) throw new Error('Audit admission unavailable');
}

export async function reserveChatProviderAttempt(store: ChatAuditStore, event: ChatAuditEvent, limit = chatProviderAttemptLimit(), now = new Date()) {
  const keys = chatAuditKeys(event.dateKey);
  const budgetDate = chatAuditDate(now);
  const attempt = event.attempts.at(-1);
  if (attempt) attempt.budgetDate = budgetDate;
  const reference = JSON.stringify({ requestId: event.id, requestDate: event.dateKey, attempt: attempt?.number ?? 0, budgetDate });
  const budgetKeys = chatAuditKeys(budgetDate);
  const result = Number(await store.eval(RESERVE_CHAT_PROVIDER_SCRIPT, [budgetKeys.budget, keys.rows, budgetKeys.attemptRefs, budgetKeys.attemptSeen], [event.id, JSON.stringify(event), limit, chatAuditExpiration(budgetDate), chatAuditExpiration(event.dateKey), reference, `${event.id}:${attempt?.number ?? 0}`]));
  if (result === 0) throw new ChatProviderBudgetExceeded();
  if (result !== 1) throw new Error('Audit admission unavailable');
}

export function authorizedChatAudit(headers: Headers) {
  const expected = process.env.SITE_CHAT_ADMIN_TOKEN;
  const provided = headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1] || '';
  if (!expected || !provided) return false;
  const digest = (value: string) => crypto.createHash('sha256').update(value).digest();
  return crypto.timingSafeEqual(digest(provided), digest(expected));
}

const EXPORT_FIELDS = ['schemaVersion', 'id', 'createdAt', 'dateKey', 'completedAt', 'kind', 'state', 'outcome', 'status',
  'conversationId', 'ip', 'country', 'region', 'city', 'userAgent', 'maintenance', 'pagePath', 'language', 'question',
  'questionTruncated', 'reply', 'replyTruncated', 'visitorHash', 'browserHash', 'ipHash', 'model', 'provider',
  'promptVersion', 'indexVersion', 'indexFingerprint', 'sourceSlugs', 'sourceChunkIds', 'responseMode', 'attempts', 'providerAttempts', 'promptTokens',
  'completionTokens', 'totalTokens', 'usageComplete', 'durationMs', 'retryReason', 'retryOutcome', 'finalValidationFailure', 'upstreamStatus'] as const;

function exportChatAuditEvent(value: unknown) {
  const row = typeof value === 'string' ? JSON.parse(value) as ChatAuditEvent : value as ChatAuditEvent;
  if (!row || row.schemaVersion !== 1 || !UUID.test(row.id) || typeof row.question !== 'string' || row.question.length > CHAT_AUDIT_QUESTION_LIMIT || typeof row.reply !== 'string' || row.reply.length > CHAT_AUDIT_REPLY_LIMIT || !Array.isArray(row.attempts) || row.attempts.length > 2) throw new Error('Invalid audit row');
  return Object.fromEntries(EXPORT_FIELDS.filter(field => row[field] !== undefined).map(field => [field, row[field]]));
}

export async function readChatAudit(store: ChatAuditStore, date: string, kind: ChatAuditKind, limit: number, offset: number, snapshot?: number, now = new Date()) {
  const cap = kind === 'accepted' ? CHAT_AUDIT_MAX_PER_DAY : CHAT_AUDIT_REJECTED_MAX_PER_DAY;
  if (!validChatAuditDate(date, now) || !Number.isInteger(limit) || limit < 1 || limit > 200 || !Number.isInteger(offset) || offset < 0 || offset > cap || (snapshot !== undefined && (!Number.isInteger(snapshot) || snapshot < offset || snapshot > cap))) throw new Error('Invalid audit query');
  const keys = chatAuditKeys(date, kind);
  const raw = await store.eval(READ_CHAT_AUDIT_SCRIPT, [keys.ids, keys.rows, keys.stats, keys.budget, keys.attemptRefs], [snapshot ?? -1, offset, limit]);
  if (!Array.isArray(raw) || raw.length < 6 || Number(raw[1]) < offset || !Array.isArray(raw[5])) throw new Error('Audit snapshot unavailable');
  const [total, frozen, next, dropped, attempts, refs, ...events] = raw;
  const providerAttemptReferences = (refs as unknown[]).map(value => {
    const ref = typeof value === 'string' ? JSON.parse(value) : value;
    if (!ref || !UUID.test(ref.requestId) || !/^\d{4}-\d{2}-\d{2}$/.test(ref.requestDate) || ref.budgetDate !== date || ![1, 2].includes(ref.attempt)) throw new Error('Invalid provider attempt reference');
    return { requestId: ref.requestId, requestDate: ref.requestDate, budgetDate: ref.budgetDate, attempt: ref.attempt };
  });
  return { schemaVersion: 1, date, kind, timeZone: 'Asia/Tokyo', retentionDays: CHAT_AUDIT_RETENTION_DAYS,
    order: 'newest-admitted-first', totalStored: Number(total), snapshot: Number(frozen), offset, limit,
    nextOffset: Number(next) < Number(frozen) ? Number(next) : null, droppedRequests: Number(dropped),
    providerAttempts: Number(attempts), providerAttemptReferences, providerAttemptLimit: chatProviderAttemptLimit(), events: events.map(exportChatAuditEvent) };
}
