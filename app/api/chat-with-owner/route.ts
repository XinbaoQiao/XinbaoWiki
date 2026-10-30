import crypto from 'node:crypto';
import { Redis } from '@upstash/redis';
import { after, NextRequest, NextResponse } from 'next/server';
import { getOwnerChatSystemPrompt, SITE_CHAT_PROMPT_VERSION } from '@/lib/chat-with-owner';
import {
  deterministicAbstentionReply,
  resolveConversationalReply,
  resolveGroundedReplyWithRetry,
  WIKI_CHAT_RESPONSE_POLICY_VERSION,
  type CitationRetryReason,
  type ProviderValidationFailure,
  type ProviderCompletionAttempt,
  type ProviderUsage
} from '@/lib/wiki-chat-response';
import { getWikiRetrievalIndex, retrieveWikiContext, WIKI_RETRIEVAL_INDEX_VERSION, type WikiRetrievalResult } from '@/lib/wiki-retrieval';
import {
  createChatAuditEvent, completeChatAuditEvent, startChatAudit, finishChatAudit,
  reserveChatProviderAttempt, ChatProviderBudgetExceeded, type ChatAuditAttempt,
} from '@/lib/chat-audit';

export const runtime = 'nodejs';

const MODEL = process.env.CHAT_MODEL?.trim() || 'deepseek-v4-flash';
const DEFAULT_BASE_URL = 'https://api.openlux.ai/v1';
const CHAT_BACKEND_VERSION = 'site-chat-api-v10';
const DAILY_LIMIT = 10;
const COOLDOWN_SECONDS = 4;
const HOURLY_IP_LIMIT = 80;
const HOURLY_IP_RETRY_LIMIT = 20;
const MAX_INPUT_LENGTH = 1000;
const MAX_OUTPUT_TOKENS = 450;
const REQUEST_TIMEOUT_MS = 45_000;
const QUESTION_LOG_MAX_RECENT = 2_000;
const QUESTION_LOG_RETENTION_DAYS = 90;
const QUESTION_LOG_RETENTION_MS = 60 * 60 * 24 * 1_000 * QUESTION_LOG_RETENTION_DAYS;
const COOKIE_NAME = 'site_chat_vid';
const ERROR_COPY = {
  en: {
    unavailable: 'Site AI is temporarily unavailable. Please try again later.',
    dailyLimit: 'Daily limit reached. Please come back tomorrow.',
    cooldown: 'Please wait a few seconds before sending another message.',
    hourly: 'Please wait before trying again.'
  },
  zh: {
    unavailable: 'Site AI 暂时不可用，请稍后重试。',
    dailyLimit: '今日消息次数已用完，请明天再来。',
    cooldown: '请稍等几秒再发送下一条消息。',
    hourly: '请求过于频繁，请稍后再试。'
  }
} as const;

type ChatLanguage = 'en' | 'zh';
type ChatErrorKey = keyof typeof ERROR_COPY.en;

function localizedError(language: ChatLanguage, key: ChatErrorKey) {
  return ERROR_COPY[language][key];
}

function softGroundedFallbackReply(language: ChatLanguage) {
  return language === 'zh'
    ? '刚才这次没能把公开 wiki 证据整理成可核对的回答。可以再试一次，或先打开研究 / 论文 / 项目页面浏览。'
    : 'I could not assemble a citation-checked answer from the public wiki just now. Please try again, or browse the Research, Publications, or Projects pages.';
}
type ChatResponseMode = 'model-grounded' | 'model-conversational' | 'deterministic-abstention';
type ProviderReservationPolicy = 'release' | 'retain';
type ParsedChatBody = { message?: unknown; language?: ChatLanguage; conversationId?: unknown };
type CompletionResponse = {
  choices?: Array<{ message?: { content?: unknown } }>;
  usage?: ProviderUsage;
};
type RequestIdentity = { visitorHash: string; browserHash: string; ipHash: string };
type QuestionLogEntry = {
  id: string;
  createdAt: string;
  dateKey: string;
  language: ChatLanguage;
  questionHash: string;
  messageLength: number;
  pagePath: string;
  visitorHash: string;
  browserHash: string;
  ipHash: string;
  model: string;
  provider: string;
  promptVersion: string;
  indexVersion: string;
  indexFingerprint: string;
  sourceChunkIds: string[];
  sourceSlugs: string[];
  evidenceScore: number;
  queryCoverage: number;
  shouldAbstain: boolean;
  responseMode: ChatResponseMode;
  blockedReason: WikiRetrievalResult['blockedReason'];
};

type ChatObservation = {
  traceId: string;
  outcome: 'ok' | 'ok-conversational' | 'deterministic-abstention' | 'invalid-citations' | 'protected-output' | 'retry-rate-limited' | 'invalid-conversational-reply' | 'upstream-error' | 'empty-reply' | 'timeout' | 'client-aborted' | 'request-error' | 'site-budget-exhausted';
  provider: string;
  model: string;
  promptVersion: string;
  indexVersion: string;
  indexFingerprint: string;
  retrievedChunks: number;
  evidenceScore: number;
  queryCoverage: number;
  shouldAbstain: boolean;
  retrievalShouldAbstain: boolean;
  responseMode: ChatResponseMode;
  blockedReason: WikiRetrievalResult['blockedReason'];
  durationMs: number;
  providerAttempts: number;
  retryReason?: CitationRetryReason;
  retryOutcome: 'not-attempted' | 'succeeded' | 'failed' | 'rate-limited';
  finalValidationFailure?: ProviderValidationFailure;
  upstreamStatus?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

let redisClient: Redis | null = null;

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redisClient ??= new Redis({ url, token });
  return redisClient;
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  cookie?: { visitorId: string; shouldSet: boolean },
  options: { retryAfterSeconds?: number } = {}
) {
  const response = NextResponse.json(body, { status });
  response.headers.set('Cache-Control', 'private, no-store');
  if (status === 429 && options.retryAfterSeconds) {
    response.headers.set('Retry-After', String(Math.max(1, Math.ceil(options.retryAfterSeconds))));
  }
  if (cookie?.shouldSet) {
    response.cookies.set(COOKIE_NAME, cookie.visitorId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365
    });
  }
  return response;
}

function genericUnavailable(
  cookie?: { visitorId: string; shouldSet: boolean },
  language: ChatLanguage = 'en'
) {
  return jsonResponse({ error: localizedError(language, 'unavailable') }, 503, cookie);
}

function getVisitorId(request: NextRequest) {
  const existing = request.cookies.get(COOKIE_NAME)?.value;
  if (existing && /^[a-f0-9-]{32,64}$/i.test(existing)) {
    return { visitorId: existing, shouldSet: false };
  }

  const localOverride = process.env.NODE_ENV !== 'production' ? process.env.CHAT_TEST_VISITOR_ID : undefined;
  return { visitorId: localOverride || crypto.randomUUID(), shouldSet: !localOverride };
}

function requestIp(request: NextRequest) {
  const localOverride = process.env.NODE_ENV !== 'production' ? process.env.CHAT_TEST_IP : undefined;
  if (localOverride) return localOverride;
  const vercelForwarded = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim();
  if (process.env.VERCEL === '1' && vercelForwarded) return vercelForwarded;
  if (process.env.CHAT_TRUST_PROXY_HEADERS === 'true') {
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwarded) return forwarded;
    const realIp = request.headers.get('x-real-ip')?.trim();
    if (realIp) return realIp;
  }
  return 'anonymous-network';
}

function hashIdentity(value: string) {
  const salt = process.env.RATE_LIMIT_SALT;
  if (!salt) return '';
  return crypto.createHash('sha256').update(`${salt}:${value}`).digest('hex').slice(0, 40);
}

function getRequestIdentity(request: NextRequest, visitorId: string): RequestIdentity | null {
  const ip = requestIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const visitorHash = hashIdentity(`${visitorId}:${ip}:${userAgent}`);
  const browserHash = hashIdentity(`${ip}:${userAgent}`);
  const ipHash = hashIdentity(ip);
  if (!visitorHash || !browserHash || !ipHash) return null;
  return { visitorHash, browserHash, ipHash };
}

function tokyoDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day)
  };
}

function tokyoDateKey(date = new Date()) {
  const { year, month, day } = tokyoDateParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function secondsUntilNextTokyoMidnight(now = new Date()) {
  const { year, month, day } = tokyoDateParts(now);
  const nextTokyoMidnightUtc = Date.UTC(year, month - 1, day + 1, -9, 0, 0);
  return Math.max(60, Math.ceil((nextTokyoMidnightUtc - now.getTime()) / 1000));
}

function dailyQuotaKeys(dateKey: string, identity: RequestIdentity) {
  return [
    `site-chat:daily:${dateKey}:visitor:${identity.visitorHash}`,
    `site-chat:daily:${dateKey}:browser:${identity.browserHash}`
  ];
}

async function readDailyUsage(redis: Redis, keys: string[]) {
  const values = await Promise.all(keys.map((key) => redis.get<number>(key)));
  return Math.max(0, ...values.map((value) => Number(value) || 0));
}

async function reserveDailyUsage(redis: Redis, keys: string[], ttl: number) {
  return redis.eval<[number, number], number>(
    `local highest = 0
for _, key in ipairs(KEYS) do
  local value = tonumber(redis.call('GET', key) or '0')
  if value > highest then highest = value end
end
if highest >= tonumber(ARGV[2]) then return tonumber(ARGV[2]) + 1 end
for _, key in ipairs(KEYS) do
  local value = redis.call('INCR', key)
  if value == 1 then redis.call('EXPIRE', key, tonumber(ARGV[1])) end
  if value > highest then highest = value end
end
return highest`,
    keys,
    [ttl, DAILY_LIMIT]
  );
}

async function releaseDailyUsage(redis: Redis, keys: string[]) {
  await redis.eval<[], number>(
    `for _, key in ipairs(KEYS) do
  local value = tonumber(redis.call('GET', key) or '0')
  if value > 0 then redis.call('DECR', key) end
end
return 1`,
    keys,
    []
  );
}

async function refundDailyUsage(redis: Redis, keys: string[]) {
  await releaseDailyUsage(redis, keys).catch(() => logServerIssue('daily quota refund failed'));
}

async function reserveHourlyRetry(redis: Redis, key: string) {
  try {
    const count = await redis.eval<[number], number>(
      `local value = redis.call('INCR', KEYS[1])
if value == 1 then redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1])) end
return value`,
      [key],
      [60 * 60]
    );
    return Number(count) <= HOURLY_IP_RETRY_LIMIT;
  } catch {
    return false;
  }
}

async function reserveCooldown(redis: Redis, key: string) {
  try {
    const result = await redis.eval<[number], [number, number]>(
      `local ttl = redis.call('TTL', KEYS[1])
if ttl > 0 then return {0, ttl} end
if ttl == -1 then
  redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1]))
  return {0, tonumber(ARGV[1])}
end
redis.call('SET', KEYS[1], '1', 'EX', tonumber(ARGV[1]))
return {1, 0}`,
      [key],
      [COOLDOWN_SECONDS]
    );
    return { reserved: Number(result[0]) === 1, retryAfterSeconds: Math.max(1, Number(result[1]) || COOLDOWN_SECONDS) };
  } catch {
    logServerIssue('cooldown reservation failed');
    return null;
  }
}

async function clearCooldown(redis: Redis, key: string) {
  await redis.del(key).catch(() => logServerIssue('cooldown cleanup failed'));
}

function linkedRequestController(requestSignal: AbortSignal, timeoutMs: number) {
  const controller = new AbortController();
  let abortReason: 'client' | 'timeout' | null = requestSignal.aborted ? 'client' : null;
  const abort = (reason: 'client' | 'timeout') => {
    abortReason ??= reason;
    if (!controller.signal.aborted) controller.abort();
  };
  const onClientAbort = () => abort('client');
  if (requestSignal.aborted) {
    abort('client');
  } else {
    requestSignal.addEventListener('abort', onClientAbort, { once: true });
  }
  const timeout = setTimeout(() => abort('timeout'), timeoutMs);
  return {
    signal: controller.signal,
    get timedOut() {
      return abortReason === 'timeout';
    },
    get clientAborted() {
      return abortReason === 'client';
    },
    cleanup() {
      clearTimeout(timeout);
      requestSignal.removeEventListener('abort', onClientAbort);
    }
  };
}

function inferLanguage(request: NextRequest): ChatLanguage {
  const referer = request.headers.get('referer') || '';
  return /_zh(?:\/|\?|#|$)|\/Your_Name_zh\//.test(referer) ? 'zh' : 'en';
}

async function parseBody(request: NextRequest) {
  try {
    if (Number(request.headers.get('content-length')) > 16_384) return null;
    const reader = request.body?.getReader();
    if (!reader) return null;
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let bytes = 0;
    let text = '';
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > 16_384) { await reader.cancel(); return null; }
        text += decoder.decode(chunk.value, { stream: true });
      }
      text += decoder.decode();
    } finally { reader.releaseLock(); }
    const value = JSON.parse(text) as unknown;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const body = value as Record<string, unknown>;
    return {
      message: body.message,
      language: body.language === 'en' || body.language === 'zh' ? body.language : undefined,
      conversationId: body.conversationId,
    } satisfies ParsedChatBody;
  } catch {
    return null;
  }
}

function logServerIssue(type: string, status?: number) {
  if (status) {
    console.error(`[chat-with-owner] ${type}: ${status}`);
    return;
  }
  console.error(`[chat-with-owner] ${type}`);
}

function providerName(baseUrl: string) {
  try {
    const hostname = new URL(baseUrl).hostname.toLocaleLowerCase();
    if (hostname === 'api.openlux.ai') return 'openlux-openai-compatible';
    if (hostname === 'api.yunwu.ai') return 'yunwu-openai-compatible';
    if (hostname === 'api.deepseek.com') return 'deepseek';
  } catch {
    // Configuration validation is handled by the upstream request.
  }
  return 'openai-compatible';
}

function modelApiConfiguration() {
  const apiKey = process.env.YUNWU_API_KEY?.trim() || '';
  const configuredBaseUrl = (process.env.YUNWU_API_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/$/, '');
  try {
    const url = new URL(configuredBaseUrl);
    const supportedProtocol = url.protocol === 'https:' || (process.env.NODE_ENV !== 'production' && url.protocol === 'http:');
    return { apiKey, baseUrl: configuredBaseUrl, ready: Boolean(apiKey && supportedProtocol && url.hostname) };
  } catch {
    return { apiKey, baseUrl: configuredBaseUrl, ready: false };
  }
}

function numericUsage(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.round(value) : undefined;
}

function combinedUsage(...values: Array<CompletionResponse['usage'] | undefined>): CompletionResponse['usage'] {
  const sum = (field: 'prompt_tokens' | 'completion_tokens' | 'total_tokens') => {
    const numbers = values.map((value) => numericUsage(value?.[field])).filter((value): value is number => value !== undefined);
    return numbers.length > 0 ? numbers.reduce((total, value) => total + value, 0) : undefined;
  };
  return {
    prompt_tokens: sum('prompt_tokens'),
    completion_tokens: sum('completion_tokens'),
    total_tokens: sum('total_tokens')
  };
}

function logChatObservation(observation: ChatObservation) {
  console.info('[chat-with-owner] completion', JSON.stringify(observation));
}

function sanitizeRefererPath(request: NextRequest) {
  const referer = request.headers.get('referer') || '';
  if (!referer) return '';
  try {
    const url = new URL(referer);
    return url.pathname.slice(0, 180);
  } catch {
    return '';
  }
}

function questionFingerprint(message: string) {
  return hashIdentity(`question:${message.replace(/\s+/g, ' ').trim().toLocaleLowerCase()}`);
}

function contextSlugFromPagePath(pagePath: string) {
  const encoded = pagePath.match(/\/wiki\/([^/?#]+)/)?.[1];
  if (!encoded) return '';
  try {
    const slug = decodeURIComponent(encoded);
    return /^[A-Za-z0-9_\-\u4e00-\u9fff]+$/u.test(slug) ? slug : '';
  } catch {
    return '';
  }
}

function questionLogExpiration(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const tokyoDayStart = Date.UTC(year, month - 1, day) - 9 * 60 * 60 * 1_000;
  return Math.floor((tokyoDayStart + QUESTION_LOG_RETENTION_MS) / 1_000);
}

async function recordQuestionLog(
  redis: Redis,
  identity: RequestIdentity,
  message: string,
  pagePath: string,
  dateKey: string,
  language: ChatLanguage,
  retrieval: WikiRetrievalResult,
  provider: string,
  responseMode: ChatResponseMode
) {
  const questionHash = questionFingerprint(message);
  if (!questionHash) return;
  const createdAt = new Date();
  const entry: QuestionLogEntry = {
    id: crypto.randomUUID(),
    createdAt: createdAt.toISOString(),
    dateKey,
    language,
    questionHash,
    messageLength: message.length,
    pagePath,
    visitorHash: identity.visitorHash,
    browserHash: identity.browserHash,
    ipHash: identity.ipHash,
    model: MODEL,
    provider,
    promptVersion: SITE_CHAT_PROMPT_VERSION,
    indexVersion: retrieval.indexVersion,
    indexFingerprint: retrieval.indexFingerprint,
    sourceChunkIds: retrieval.sources.map((source) => source.chunkId),
    sourceSlugs: [...new Set(retrieval.sources.map((source) => source.slug))],
    evidenceScore: retrieval.evidenceScore,
    queryCoverage: retrieval.queryCoverage,
    shouldAbstain: retrieval.shouldAbstain,
    responseMode,
    blockedReason: retrieval.blockedReason
  };
  const payload = JSON.stringify(entry);
  const dayKey = `site-chat:questions:day:${dateKey}`;
  const frequencyKey = `site-chat:questions:frequency:${language}:${dateKey}`;
  const expiresAt = questionLogExpiration(dateKey);

  try {
    const pipeline = redis.pipeline();
    pipeline.lpush(dayKey, payload);
    pipeline.ltrim(dayKey, 0, QUESTION_LOG_MAX_RECENT - 1);
    pipeline.expireat(dayKey, expiresAt);
    pipeline.zincrby(frequencyKey, 1, entry.questionHash);
    pipeline.expireat(frequencyKey, expiresAt);
    await pipeline.exec();
  } catch {
    logServerIssue('question log write failed');
  }
}

function withOwnerSignature(
  reply: string,
  language: ChatLanguage,
  tone: 'casual' | 'plain' = 'plain'
) {
  const trimmed = reply.trim();
  if (tone !== 'casual') return trimmed;
  // Light brand sign-off for casual conversation only; never stack onto grounded academic answers.
  // TEMPLATE: optional sign-off, e.g. SITE_CHAT_SIGNATURE_EN=" cheers~". Empty by default.
  const raw = (language === 'zh' ? process.env.SITE_CHAT_SIGNATURE_ZH : process.env.SITE_CHAT_SIGNATURE_EN) || '';
  const signature = raw.slice(0, 24);
  if (!signature.trim()) return trimmed;
  if (trimmed.endsWith(signature.trim())) return trimmed;
  const unsigned = trimmed
    .trim()
    .replace(/[。！？.!?]+$/u, '');
  if (!unsigned) return signature.trim();
  return `${unsigned}${signature}`;
}

export async function GET(request: NextRequest) {
  const visitorCookie = getVisitorId(request);
  const language = inferLanguage(request);
  const redis = getRedis();
  if (!redis || !process.env.RATE_LIMIT_SALT) {
    logServerIssue('missing quota configuration');
    return genericUnavailable(visitorCookie, language);
  }

  const identity = getRequestIdentity(request, visitorCookie.visitorId);
  if (!identity) return genericUnavailable(visitorCookie, language);

  let dailyUsage: number;
  try {
    dailyUsage = await readDailyUsage(redis, dailyQuotaKeys(tokyoDateKey(), identity));
  } catch {
    logServerIssue('daily quota read failed');
    return genericUnavailable(visitorCookie, language);
  }
  const diagnostic = new URL(request.url).searchParams.get('diagnostic') === 'retrieval';
  const modelConfiguration = modelApiConfiguration();
  if (diagnostic && !modelConfiguration.ready) {
    logServerIssue('missing model API configuration');
    return genericUnavailable(visitorCookie, language);
  }
  let retrievalHealth: Record<string, unknown> | undefined;
  if (diagnostic) {
    try {
      const index = getWikiRetrievalIndex();
      retrievalHealth = {
        indexVersion: index.indexVersion,
        indexFingerprint: index.indexFingerprint,
        indexedChunks: index.chunks.length
      };
    } catch {
      logServerIssue('retrieval health failed');
      return genericUnavailable(visitorCookie, language);
    }
  }
  return jsonResponse(
    {
      remaining: Math.max(0, DAILY_LIMIT - dailyUsage),
      limit: DAILY_LIMIT,
      meta: {
        backendVersion: CHAT_BACKEND_VERSION,
        responsePolicyVersion: WIKI_CHAT_RESPONSE_POLICY_VERSION,
        model: MODEL,
        promptVersion: SITE_CHAT_PROMPT_VERSION,
        retrievalAlgorithm: WIKI_RETRIEVAL_INDEX_VERSION,
        modelApiConfigured: modelConfiguration.ready,
        ...retrievalHealth
      }
    },
    200,
    visitorCookie
  );
}

export async function POST(request: NextRequest) {
  const traceId = crypto.randomUUID();
  const requestStartedAt = Date.now();
  const visitorCookie = getVisitorId(request);
  const body = await parseBody(request);
  const language: ChatLanguage = body?.language ?? inferLanguage(request);
  async function reject(response: NextResponse, reason: string) {
    response.headers.set('x-chat-request-id', traceId);
    try {
      const store = getRedis();
      if (store) {
        const event = createChatAuditEvent(request.headers, {
          id: traceId, now: new Date(requestStartedAt), kind: 'rejected',
          message: typeof body?.message === 'string' ? body.message : '', language,
          conversationId: body?.conversationId, pagePath: sanitizeRefererPath(request),
          identity: getRequestIdentity(request, visitorCookie.visitorId), model: MODEL,
        });
        completeChatAuditEvent(event, { outcome: reason, status: response.status });
        if (!await startChatAudit(store, event)) logServerIssue('rejection audit capacity reached');
      }
    } catch { logServerIssue('rejection audit write failed'); }
    return response;
  }
  if (!body || typeof body.message !== 'string') {
    return reject(jsonResponse({
      error: language === 'zh' ? '请求无效。' : 'Invalid request.'
    }, 400, visitorCookie), 'invalid-request');
  }

  const message = body.message.trim();
  if (!message) {
    return reject(jsonResponse({
      error: language === 'zh' ? '请输入消息。' : 'Message is required.'
    }, 400, visitorCookie), 'empty-message');
  }
  if (message.length > MAX_INPUT_LENGTH) {
    return reject(jsonResponse({
      error: language === 'zh'
        ? `消息请控制在 ${MAX_INPUT_LENGTH} 个字符以内。`
        : `Message must be ${MAX_INPUT_LENGTH} characters or fewer.`
    }, 400, visitorCookie), 'input-too-long');
  }

  const modelConfiguration = modelApiConfiguration();
  const redis = getRedis();
  if (!modelConfiguration.ready || !redis || !process.env.RATE_LIMIT_SALT || !process.env.SITE_CHAT_ADMIN_TOKEN) {
    logServerIssue('missing server configuration');
    return reject(genericUnavailable(visitorCookie, language), 'server-unavailable');
  }
  const chatRedis = redis;

  const identity = getRequestIdentity(request, visitorCookie.visitorId);
  if (!identity) return reject(genericUnavailable(visitorCookie, language), 'identity-unavailable');

  const dateKey = tokyoDateKey();
  const dailyKeys = dailyQuotaKeys(dateKey, identity);
  const cooldownKey = `site-chat:cooldown:${identity.visitorHash}`;
  const hourBucket = Math.floor(Date.now() / 3_600_000);
  const hourlyIpKey = `site-chat:ip-hour:${identity.ipHash}:${hourBucket}`;
  const hourlyRetryKey = `site-chat:retry-hour:${identity.ipHash}:${hourBucket}`;
  const quotaTtl = secondsUntilNextTokyoMidnight();

  let previousDailyCount: number;
  try {
    previousDailyCount = await readDailyUsage(redis, dailyKeys);
  } catch {
    logServerIssue('daily quota read failed');
    return reject(genericUnavailable(visitorCookie, language), 'quota-read-failed');
  }
  if (previousDailyCount >= DAILY_LIMIT) {
    return reject(jsonResponse(
      { error: localizedError(language, 'dailyLimit'), remaining: 0, limit: DAILY_LIMIT },
      429,
      visitorCookie,
      { retryAfterSeconds: quotaTtl }
    ), 'daily-limit');
  }

  const cooldown = await reserveCooldown(redis, cooldownKey);
  if (!cooldown) return reject(genericUnavailable(visitorCookie, language), 'cooldown-unavailable');
  if (!cooldown.reserved) {
    return reject(jsonResponse(
      {
        error: localizedError(language, 'cooldown'),
        remaining: Math.max(0, DAILY_LIMIT - previousDailyCount),
        limit: DAILY_LIMIT
      },
      429,
      visitorCookie,
      { retryAfterSeconds: cooldown.retryAfterSeconds }
    ), 'cooldown');
  }

  let hourlyIpCount: number;
  try {
    hourlyIpCount = await redis.incr(hourlyIpKey);
    if (hourlyIpCount === 1) await redis.expire(hourlyIpKey, 60 * 60);
  } catch {
    logServerIssue('hourly IP reservation failed');
    await clearCooldown(chatRedis, cooldownKey);
    return reject(genericUnavailable(visitorCookie, language), 'hourly-reservation-failed');
  }
  if (hourlyIpCount > HOURLY_IP_LIMIT) {
    await clearCooldown(chatRedis, cooldownKey);
    return reject(jsonResponse(
      { error: localizedError(language, 'hourly'), remaining: Math.max(0, DAILY_LIMIT - previousDailyCount), limit: DAILY_LIMIT },
      429,
      visitorCookie,
      { retryAfterSeconds: Math.max(1, 60 * 60 - (Math.floor(Date.now() / 1000) % (60 * 60))) }
    ), 'hourly-limit');
  }

  let dailyCount: number;
  try {
    dailyCount = await reserveDailyUsage(redis, dailyKeys, quotaTtl);
  } catch {
    logServerIssue('daily quota reservation failed');
    await clearCooldown(chatRedis, cooldownKey);
    return reject(genericUnavailable(visitorCookie, language), 'daily-reservation-failed');
  }
  if (dailyCount > DAILY_LIMIT) {
    await clearCooldown(chatRedis, cooldownKey);
    return reject(jsonResponse(
      { error: localizedError(language, 'dailyLimit'), remaining: 0, limit: DAILY_LIMIT },
      429,
      visitorCookie,
      { retryAfterSeconds: quotaTtl }
    ), 'daily-limit');
  }

  const { apiKey, baseUrl } = modelConfiguration;
  const provider = providerName(baseUrl);
  const pagePath = sanitizeRefererPath(request);
  let retrieval: WikiRetrievalResult;
  try {
    retrieval = retrieveWikiContext(message, {
      language,
      contextSlug: contextSlugFromPagePath(pagePath)
    });
  } catch {
    logServerIssue('retrieval failed');
    await refundDailyUsage(chatRedis, dailyKeys);
    await clearCooldown(chatRedis, cooldownKey);
    return reject(genericUnavailable(visitorCookie, language), 'retrieval-failed');
  }

  const responseMode: ChatResponseMode = retrieval.blockedReason
    ? 'deterministic-abstention'
    : retrieval.shouldAbstain
      ? 'model-conversational'
      : 'model-grounded';
  const auditEvent = createChatAuditEvent(request.headers, {
    id: traceId, now: new Date(requestStartedAt), message, language, conversationId: body.conversationId,
    pagePath, identity, model: MODEL, provider, promptVersion: SITE_CHAT_PROMPT_VERSION,
    indexVersion: retrieval.indexVersion, indexFingerprint: retrieval.indexFingerprint,
    sourceSlugs: retrieval.sources.map(source => source.slug), sourceChunkIds: retrieval.sources.map(source => source.chunkId), responseMode,
  });
  try {
    if (!await startChatAudit(chatRedis, auditEvent)) throw new Error('audit capacity');
  } catch {
    logServerIssue('paid-call audit admission failed');
    await refundDailyUsage(chatRedis, dailyKeys);
    await clearCooldown(chatRedis, cooldownKey);
    return reject(genericUnavailable(visitorCookie, language), 'audit-admission-failed');
  }
  after(() => recordQuestionLog(redis, identity, message, pagePath, dateKey, language, retrieval, provider, responseMode));
  let terminalObserved = false;

  async function observe(
    outcome: ChatObservation['outcome'],
    details: {
      finalValidationFailure?: ProviderValidationFailure;
      providerAttempts?: number;
      retryOutcome?: ChatObservation['retryOutcome'];
      retryReason?: CitationRetryReason;
      upstreamStatus?: number;
      usage?: ProviderUsage;
      reply?: string;
      status?: number;
    } = {}
  ) {
    if (terminalObserved) return;
    terminalObserved = true;
    completeChatAuditEvent(auditEvent, { outcome, status: details.status ?? 200, reply: details.reply,
      durationMs: Date.now() - requestStartedAt, retryReason: details.retryReason,
      retryOutcome: details.retryOutcome, finalValidationFailure: details.finalValidationFailure,
      upstreamStatus: details.upstreamStatus,
    });
    try { await finishChatAudit(chatRedis, auditEvent); }
    catch { logServerIssue('chat audit finalization failed'); }
    logChatObservation({
      traceId,
      outcome,
      provider,
      model: MODEL,
      promptVersion: SITE_CHAT_PROMPT_VERSION,
      indexVersion: retrieval.indexVersion,
      indexFingerprint: retrieval.indexFingerprint,
      retrievedChunks: retrieval.sources.length,
      evidenceScore: retrieval.evidenceScore,
      queryCoverage: retrieval.queryCoverage,
      shouldAbstain: responseMode === 'deterministic-abstention',
      retrievalShouldAbstain: retrieval.shouldAbstain,
      responseMode,
      blockedReason: retrieval.blockedReason,
      durationMs: Date.now() - requestStartedAt,
      providerAttempts: details.providerAttempts ?? 0,
      retryReason: details.retryReason,
      retryOutcome: details.retryOutcome ?? 'not-attempted',
      finalValidationFailure: details.finalValidationFailure,
      upstreamStatus: details.upstreamStatus,
      promptTokens: numericUsage(details.usage?.prompt_tokens),
      completionTokens: numericUsage(details.usage?.completion_tokens),
      totalTokens: numericUsage(details.usage?.total_tokens)
    });
  }

  function responseMetadata(citedChunks: number, providerAttempts: number, retryReason?: CitationRetryReason) {
    return {
      traceId,
      backendVersion: CHAT_BACKEND_VERSION,
      responsePolicyVersion: WIKI_CHAT_RESPONSE_POLICY_VERSION,
      responseMode,
      provider,
      model: MODEL,
      promptVersion: SITE_CHAT_PROMPT_VERSION,
      indexVersion: retrieval.indexVersion,
      indexFingerprint: retrieval.indexFingerprint,
      retrievedChunks: retrieval.sources.length,
      citedChunks,
      providerAttempts,
      retryReason: retryReason ?? null,
      retryOutcome: retryReason ? 'succeeded' : 'not-attempted',
      evidenceScore: retrieval.evidenceScore,
      queryCoverage: retrieval.queryCoverage,
      shouldAbstain: responseMode === 'deterministic-abstention',
      retrievalShouldAbstain: retrieval.shouldAbstain,
      blockedReason: retrieval.blockedReason,
      durationMs: Date.now() - requestStartedAt
    };
  }

  if (responseMode === 'deterministic-abstention') {
    const reply = withOwnerSignature(deterministicAbstentionReply(message, language, retrieval.blockedReason), language, 'plain');
    await observe('deterministic-abstention', { reply });
    return jsonResponse(
      {
        reply,
        sources: [],
        remaining: Math.max(0, DAILY_LIMIT - dailyCount),
        limit: DAILY_LIMIT,
        meta: responseMetadata(0, 0)
      },
      200,
      visitorCookie
    );
  }

  const providerAbort = linkedRequestController(request.signal, REQUEST_TIMEOUT_MS);
  const systemPrompt = getOwnerChatSystemPrompt(
    language,
    retrieval,
    responseMode === 'model-grounded' ? 'grounded' : 'conversational'
  );
  let providerAttempts = 0;
  let accumulatedUsage: ProviderUsage | undefined;
  let activeRetryReason: CitationRetryReason | undefined;

  async function requestCompletion(
    prompt: string,
    temperature: number,
    signal: AbortSignal
  ): Promise<ProviderCompletionAttempt> {
    // Persist each reservation before any upstream request, including the citation retry.
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const attempt: ChatAuditAttempt = { number: providerAttempts + 1, startedAt: new Date().toISOString(), outcome: 'started', usageReported: false };
    auditEvent.attempts.push(attempt);
    auditEvent.providerAttempts = auditEvent.attempts.length;
    auditEvent.usageComplete = false;
    try { await reserveChatProviderAttempt(chatRedis, auditEvent); }
    catch (error) { auditEvent.attempts.pop(); auditEvent.providerAttempts = providerAttempts; throw error; }
    providerAttempts += 1;
    try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      // OpenLux/deepseek-v4-flash silently drops long (and often any) system-role
      // content (prompt_tokens collapses to ~user-only). Fold the prompt into the
      // user message so grounded evidence actually reaches the model.
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: `${prompt}\n\n---\nUser question:\n${message}`
          }
        ],
        temperature,
        max_tokens: MAX_OUTPUT_TOKENS,
        thinking: { type: 'disabled' },
        stream: false
      }),
      signal
    });
    attempt.status = response.status;
    if (!response.ok) { attempt.outcome = 'upstream-error'; return { kind: 'upstream-error', status: response.status }; }
    const data = (await response.json()) as CompletionResponse;
    attempt.promptTokens = numericUsage(data.usage?.prompt_tokens);
    attempt.completionTokens = numericUsage(data.usage?.completion_tokens);
    attempt.totalTokens = numericUsage(data.usage?.total_tokens);
    attempt.usageReported = attempt.promptTokens !== undefined && attempt.completionTokens !== undefined && attempt.totalTokens !== undefined;
    accumulatedUsage = combinedUsage(accumulatedUsage, data.usage);
    const reply = data.choices?.[0]?.message?.content;
    if (typeof reply !== 'string' || !reply.trim()) { attempt.outcome = 'empty'; return { kind: 'empty', usage: data.usage }; }
    attempt.outcome = 'ok';
    return { kind: 'ok', reply, usage: data.usage };
    } catch (error) { attempt.outcome = 'request-error'; throw error; }
    finally { attempt.finishedAt = new Date().toISOString(); }
  }

  async function unavailableAfterProvider(
    outcome: ChatObservation['outcome'],
    details: {
      finalValidationFailure?: ProviderValidationFailure;
      retryOutcome?: ChatObservation['retryOutcome'];
      retryReason?: CitationRetryReason;
      upstreamStatus?: number;
    } = {},
    reservationPolicy: ProviderReservationPolicy = 'release'
  ) {
    await observe(outcome, { ...details, providerAttempts, usage: accumulatedUsage, status: 503 });
    if (reservationPolicy === 'release') {
      await refundDailyUsage(chatRedis, dailyKeys);
      await clearCooldown(chatRedis, cooldownKey);
    }
    const response = genericUnavailable(visitorCookie, language);
    response.headers.set('x-chat-request-id', traceId);
    return response;
  }

  try {
    if (responseMode === 'model-conversational') {
      const conversationalResult = await resolveConversationalReply({
        requestCompletion,
        signal: providerAbort.signal,
        systemPrompt
      });
      accumulatedUsage = conversationalResult.kind === 'upstream-error'
        ? accumulatedUsage
        : conversationalResult.usage ?? accumulatedUsage;
      if (conversationalResult.kind === 'upstream-error') {
        return unavailableAfterProvider('upstream-error', { upstreamStatus: conversationalResult.status });
      }
      if (conversationalResult.kind === 'empty') {
        return unavailableAfterProvider('empty-reply');
      }
      if (conversationalResult.kind === 'invalid-conversational-reply') {
        return unavailableAfterProvider('invalid-conversational-reply', {
          finalValidationFailure: conversationalResult.finalValidationFailure
        });
      }

      const reply = withOwnerSignature(conversationalResult.reply, language, 'casual');
      await observe('ok-conversational', { providerAttempts, usage: accumulatedUsage, reply });
      return jsonResponse(
        {
          reply,
          sources: [],
          remaining: Math.max(0, DAILY_LIMIT - dailyCount),
          limit: DAILY_LIMIT,
          meta: responseMetadata(0, providerAttempts)
        },
        200,
        visitorCookie
      );
    }

    const groundedResult = await resolveGroundedReplyWithRetry({
      beforeRetry: async (reason) => {
        activeRetryReason = reason;
        return reserveHourlyRetry(chatRedis, hourlyRetryKey);
      },
      requestCompletion,
      signal: providerAbort.signal,
      sources: retrieval.sources,
      systemPrompt
    });
    accumulatedUsage = groundedResult.usage ?? accumulatedUsage;
    activeRetryReason = groundedResult.retryReason ?? activeRetryReason;
    const retryOutcome: ChatObservation['retryOutcome'] = groundedResult.kind === 'retry-rate-limited'
      ? 'rate-limited'
      : groundedResult.retryReason
        ? groundedResult.kind === 'ok' ? 'succeeded' : 'failed'
        : 'not-attempted';

    if (
      groundedResult.kind === 'upstream-error' ||
      groundedResult.kind === 'empty' ||
      groundedResult.kind === 'protected-output' ||
      groundedResult.kind === 'retry-rate-limited' ||
      groundedResult.kind === 'invalid-citations'
    ) {
      const softBase = {
        finalValidationFailure:
          groundedResult.kind === 'retry-rate-limited' ||
          groundedResult.kind === 'upstream-error' ||
          groundedResult.kind === 'empty'
            ? undefined
            : groundedResult.finalValidationFailure,
        retryOutcome,
        retryReason: groundedResult.retryReason,
        upstreamStatus: groundedResult.kind === 'upstream-error' ? groundedResult.status : undefined
      };

      // Soft grounded failures must not look like a full outage: return a deterministic
      // retry hint instead of a conversational guess that can invent papers.
      const reply = withOwnerSignature(softGroundedFallbackReply(language), language, 'plain');
      await observe(groundedResult.kind === 'empty' ? 'empty-reply' : groundedResult.kind, {
        ...softBase,
        providerAttempts,
        usage: accumulatedUsage,
        reply,
      });
      return jsonResponse(
        {
          reply,
          sources: [],
          remaining: Math.max(0, DAILY_LIMIT - dailyCount),
          limit: DAILY_LIMIT,
          meta: responseMetadata(0, providerAttempts, groundedResult.retryReason)
        },
        200,
        visitorCookie
      );
    }

    const reply = withOwnerSignature(groundedResult.response.reply, language, 'plain');
    await observe('ok', {
      providerAttempts,
      retryOutcome,
      retryReason: groundedResult.retryReason,
      usage: accumulatedUsage,
      reply,
    });
    return jsonResponse(
      {
        reply,
        sources: groundedResult.response.sources,
        remaining: Math.max(0, DAILY_LIMIT - dailyCount),
        limit: DAILY_LIMIT,
        meta: responseMetadata(groundedResult.response.sources.length, providerAttempts, groundedResult.retryReason)
      },
      200,
      visitorCookie
    );
  } catch (error) {
    if (error instanceof ChatProviderBudgetExceeded) {
      await observe('site-budget-exhausted', { providerAttempts, usage: accumulatedUsage, status: 429 });
      await refundDailyUsage(chatRedis, dailyKeys);
      await clearCooldown(chatRedis, cooldownKey);
      const response = jsonResponse({ error: localizedError(language, 'hourly') }, 429, visitorCookie, { retryAfterSeconds: quotaTtl });
      response.headers.set('x-chat-request-id', traceId);
      return response;
    }
    const aborted = error instanceof DOMException && error.name === 'AbortError';
    const providerFailureDetails = {
      retryOutcome: activeRetryReason ? 'failed' : 'not-attempted',
      retryReason: activeRetryReason
    } satisfies {
      retryOutcome: ChatObservation['retryOutcome'];
      retryReason?: CitationRetryReason;
    };
    if (aborted && providerAbort.clientAborted) {
      return unavailableAfterProvider('client-aborted', providerFailureDetails, 'retain');
    }
    const outcome = aborted && providerAbort.timedOut ? 'timeout' : 'request-error';
    return unavailableAfterProvider(outcome, providerFailureDetails, 'release');
  } finally {
    providerAbort.cleanup();
  }
}
