import crypto from 'node:crypto';
import { Redis } from '@upstash/redis';
import {
  buildComposerPredictPrompt,
  parseComposerPredictBody,
  sanitizePredictedSuffix,
  type ParsedComposerPredictBody
} from './chat-composer-predict';

export const CHAT_PREDICT_DEFAULT_MODEL = 'deepseek-v4-flash-0731';
export const CHAT_PREDICT_FALLBACK_MODEL = 'deepseek-v4.1-flash';
export const CHAT_PREDICT_MAX_TOKENS = 48;
export const CHAT_PREDICT_TIMEOUT_MS = 2_500;
export const CHAT_PREDICT_TEMPERATURE = 0.35;
export const CHAT_PREDICT_MINUTE_LIMIT = 20;
export const CHAT_PREDICT_HOURLY_LIMIT = 60;
export const CHAT_PREDICT_DAILY_VISITOR_LIMIT = 120;
export const CHAT_PREDICT_DAILY_SITE_LIMIT = 2_000;
export const CHAT_PREDICT_COOKIE_NAME = 'site_chat_vid';
export const CHAT_PREDICT_KEY_PREFIX = 'site-chat-complete:';

const DEFAULT_BASE_URL = 'https://api.openlux.ai/v1';
const CHAT_QUOTA_KEY_PREFIX = 'site-chat:';

export type ChatComposerPredictDeps = {
  now?: Date;
  env?: NodeJS.ProcessEnv;
  fetch?: typeof fetch;
  redis?: Redis | null;
  getRedis?: () => Redis | null;
};

export type ChatComposerPredictResult = {
  status: number;
  body: Record<string, unknown>;
  retryAfterSeconds?: number;
  visitorId?: string;
  shouldSetCookie?: boolean;
  model?: string;
  redisKeysTouched: string[];
};

type RequestLike = {
  cookies: { get(name: string): { value: string } | undefined };
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
  signal?: AbortSignal;
};

type CompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
};

function envOf(deps: ChatComposerPredictDeps): NodeJS.ProcessEnv {
  return deps.env ?? process.env;
}

export function predictModelId(env: NodeJS.ProcessEnv = process.env): string {
  const override = env.YUNWU_PREDICT_MODEL?.trim() || '';
  if (override && /^[a-zA-Z0-9._:/-]{1,80}$/.test(override)) return override;
  return CHAT_PREDICT_DEFAULT_MODEL;
}

export function usesChatConversationQuotaKey(key: string): boolean {
  return key.startsWith(CHAT_QUOTA_KEY_PREFIX) && !key.startsWith(CHAT_PREDICT_KEY_PREFIX);
}

function modelApiConfiguration(env: NodeJS.ProcessEnv) {
  const providerAuth = env.YUNWU_API_KEY?.trim() || '';
  const configuredBaseUrl = (env.YUNWU_API_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/$/, '');
  try {
    const url = new URL(configuredBaseUrl);
    const supportedProtocol = url.protocol === 'https:' || (env.NODE_ENV !== 'production' && url.protocol === 'http:');
    return { providerAuth, baseUrl: configuredBaseUrl, ready: Boolean(providerAuth && supportedProtocol && url.hostname) };
  } catch {
    return { providerAuth, baseUrl: configuredBaseUrl, ready: false };
  }
}

export function requestIpFromHeaders(headers: { get(name: string): string | null }, env: NodeJS.ProcessEnv = process.env): string {
  const localOverride = env.NODE_ENV !== 'production' ? env.CHAT_TEST_IP : undefined;
  if (localOverride) return localOverride;
  const vercelForwarded = headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim();
  if (env.VERCEL === '1' && vercelForwarded) return vercelForwarded;
  if (env.CHAT_TRUST_PROXY_HEADERS === 'true') {
    const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwarded) return forwarded;
    const realIp = headers.get('x-real-ip')?.trim();
    if (realIp) return realIp;
  }
  return 'anonymous-network';
}

export function getPredictVisitorId(
  cookies: { get(name: string): { value: string } | undefined },
  env: NodeJS.ProcessEnv = process.env
): { visitorId: string; shouldSet: boolean } {
  const existing = cookies.get(CHAT_PREDICT_COOKIE_NAME)?.value;
  if (existing && /^[a-f0-9-]{32,64}$/i.test(existing)) {
    return { visitorId: existing, shouldSet: false };
  }
  const localOverride = env.NODE_ENV !== 'production' ? env.CHAT_TEST_VISITOR_ID : undefined;
  return { visitorId: localOverride || crypto.randomUUID(), shouldSet: !localOverride };
}

function hashIdentity(value: string, env: NodeJS.ProcessEnv): string {
  const salt = env.RATE_LIMIT_SALT;
  if (!salt) return '';
  return crypto.createHash('sha256').update(`${salt}:${value}`).digest('hex').slice(0, 40);
}

function tokyoDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute)
  };
}

function tokyoDateKey(date: Date) {
  const { year, month, day } = tokyoDateParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function secondsUntilNextTokyoMidnight(now: Date) {
  const { year, month, day } = tokyoDateParts(now);
  const nextTokyoMidnightUtc = Date.UTC(year, month - 1, day + 1, -9, 0, 0);
  return Math.max(60, Math.ceil((nextTokyoMidnightUtc - now.getTime()) / 1000));
}

export function composerPredictRateLimitKeys(identity: { visitorHash: string; ipHash: string }, now: Date) {
  const dateKey = tokyoDateKey(now);
  const { hour, minute } = tokyoDateParts(now);
  const hourKey = `${dateKey}T${String(hour).padStart(2, '0')}`;
  const minuteKey = String(minute).padStart(2, '0');
  return {
    minute: `${CHAT_PREDICT_KEY_PREFIX}minute:${identity.ipHash}:${hourKey}:${minuteKey}`,
    hourly: `${CHAT_PREDICT_KEY_PREFIX}hourly:${identity.ipHash}:${hourKey}`,
    dailyVisitor: `${CHAT_PREDICT_KEY_PREFIX}daily:${dateKey}:visitor:${identity.visitorHash}`,
    dailySite: `${CHAT_PREDICT_KEY_PREFIX}daily:${dateKey}:site`
  };
}

async function incrWithLimit(
  redis: Redis,
  key: string,
  limit: number,
  ttl: number,
  touched: string[]
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  touched.push(key);
  if (usesChatConversationQuotaKey(key)) {
    throw new Error('predict rate limit refused a chat quota key');
  }
  const count = Number(await redis.incr(key)) || 0;
  if (count === 1) await redis.expire(key, ttl);
  if (count > limit) {
    const remainingTtl = Number(await redis.ttl(key));
    return { allowed: false, retryAfterSeconds: Math.max(1, remainingTtl > 0 ? remainingTtl : ttl) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

function emptySuggestion(status = 200, extra: Partial<ChatComposerPredictResult> = {}): ChatComposerPredictResult {
  return { status, body: { suggestion: '' }, redisKeysTouched: extra.redisKeysTouched ?? [], ...extra };
}

export async function executeChatComposerComplete(
  request: RequestLike,
  deps: ChatComposerPredictDeps = {}
): Promise<ChatComposerPredictResult> {
  const env = envOf(deps);
  const now = deps.now ?? new Date();
  const redisKeysTouched: string[] = [];
  const visitorCookie = getPredictVisitorId(request.cookies, env);
  const identityHash = (() => {
    const ip = requestIpFromHeaders(request.headers, env);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const visitorHash = hashIdentity(`${visitorCookie.visitorId}:${ip}:${userAgent}`, env);
    const ipHash = hashIdentity(ip, env);
    if (!visitorHash || !ipHash) return null;
    return { visitorHash, ipHash };
  })();

  let parsed: ParsedComposerPredictBody;
  try {
    parsed = parseComposerPredictBody(await request.json());
  } catch {
    return { status: 400, body: { error: 'invalid' }, visitorId: visitorCookie.visitorId, shouldSetCookie: visitorCookie.shouldSet, redisKeysTouched };
  }
  if (!parsed.ok) {
    const status = parsed.error === 'invalid' ? 400 : parsed.error === 'too-long' ? 400 : 400;
    return { status, body: { error: parsed.error }, visitorId: visitorCookie.visitorId, shouldSetCookie: visitorCookie.shouldSet, redisKeysTouched };
  }

  const redis = deps.redis !== undefined ? deps.redis : (deps.getRedis ? deps.getRedis() : null);
  if (!redis || !identityHash) {
    return { status: 503, body: { error: 'unavailable' }, visitorId: visitorCookie.visitorId, shouldSetCookie: visitorCookie.shouldSet, redisKeysTouched };
  }

  const keys = composerPredictRateLimitKeys(identityHash, now);
  const minuteTtl = 60;
  const hourTtl = 60 * 60;
  const dayTtl = secondsUntilNextTokyoMidnight(now);
  const windows: Array<[string, number, number]> = [
    [keys.minute, CHAT_PREDICT_MINUTE_LIMIT, minuteTtl],
    [keys.hourly, CHAT_PREDICT_HOURLY_LIMIT, hourTtl],
    [keys.dailyVisitor, CHAT_PREDICT_DAILY_VISITOR_LIMIT, dayTtl],
    [keys.dailySite, CHAT_PREDICT_DAILY_SITE_LIMIT, dayTtl]
  ];
  try {
    for (const [key, limit, ttl] of windows) {
      const result = await incrWithLimit(redis, key, limit, ttl, redisKeysTouched);
      if (!result.allowed) {
        return {
          status: 429,
          body: { error: 'rate-limited' },
          retryAfterSeconds: result.retryAfterSeconds,
          visitorId: visitorCookie.visitorId,
          shouldSetCookie: visitorCookie.shouldSet,
          redisKeysTouched
        };
      }
    }
  } catch {
    return { status: 503, body: { error: 'unavailable' }, visitorId: visitorCookie.visitorId, shouldSetCookie: visitorCookie.shouldSet, redisKeysTouched };
  }

  const config = modelApiConfiguration(env);
  const model = predictModelId(env);
  if (!config.ready) {
    return { status: 503, body: { error: 'unavailable' }, visitorId: visitorCookie.visitorId, shouldSetCookie: visitorCookie.shouldSet, model, redisKeysTouched };
  }

  const prompt = buildComposerPredictPrompt(parsed);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHAT_PREDICT_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  request.signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const fetchImpl = deps.fetch ?? fetch;
    const response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.providerAuth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: `${prompt}\n\n---\nComplete only the visitor draft suffix.`
          }
        ],
        temperature: CHAT_PREDICT_TEMPERATURE,
        max_tokens: CHAT_PREDICT_MAX_TOKENS,
        thinking: { type: 'disabled' },
        stream: false
      }),
      signal: controller.signal
    });
    if (!response.ok) return emptySuggestion(200, { visitorId: visitorCookie.visitorId, shouldSetCookie: visitorCookie.shouldSet, model, redisKeysTouched });
    const data = (await response.json()) as CompletionResponse;
    const raw = data.choices?.[0]?.message?.content;
    const suggestion = typeof raw === 'string' ? sanitizePredictedSuffix(parsed.draft, raw) : '';
    const usage = data.usage;
    console.info('[chat-with-owner-complete]', JSON.stringify({
      outcome: suggestion ? 'ok' : 'empty',
      model,
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens
    }));
    return {
      status: 200,
      body: { suggestion },
      visitorId: visitorCookie.visitorId,
      shouldSetCookie: visitorCookie.shouldSet,
      model,
      redisKeysTouched
    };
  } catch {
    return emptySuggestion(200, { visitorId: visitorCookie.visitorId, shouldSetCookie: visitorCookie.shouldSet, model, redisKeysTouched });
  } finally {
    clearTimeout(timeout);
    request.signal?.removeEventListener('abort', onAbort);
  }
}

export function assertPredictKeysAreIsolated(keys: string[]) {
  if (keys.some(usesChatConversationQuotaKey)) {
    throw new Error('composer predict touched a conversation quota key');
  }
}
