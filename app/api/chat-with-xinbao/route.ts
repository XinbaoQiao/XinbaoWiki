import crypto from 'node:crypto';
import { Redis } from '@upstash/redis';
import { after, NextRequest, NextResponse } from 'next/server';
import { getXinbaoChatSystemPrompt, XINBAO_CHAT_PROMPT_VERSION } from '@/lib/chat-with-xinbao';
import {
  deterministicAbstentionReply,
  resolveConversationalReply,
  resolveGroundedReplyWithRetry,
  WIKI_CHAT_RESPONSE_POLICY_VERSION,
  type CitationRetryReason,
  type GroundedValidationFailure,
  type ProviderCompletionAttempt,
  type ProviderUsage
} from '@/lib/wiki-chat-response';
import { getWikiRetrievalIndex, retrieveWikiContext, WIKI_RETRIEVAL_INDEX_VERSION, type WikiRetrievalResult } from '@/lib/wiki-retrieval';

export const runtime = 'nodejs';

const MODEL = 'deepseek-v4-flash';
const DEFAULT_BASE_URL = 'https://api.yunwu.ai/v1';
const CHAT_BACKEND_VERSION = 'xinbao-chat-api-v5';
const DAILY_LIMIT = 10;
const COOLDOWN_SECONDS = 4;
const HOURLY_IP_LIMIT = 80;
const HOURLY_IP_RETRY_LIMIT = 20;
const MAX_INPUT_LENGTH = 1000;
const MAX_OUTPUT_TOKENS = 450;
const REQUEST_TIMEOUT_MS = 12_000;
const QUESTION_LOG_MAX_RECENT = 2_000;
const QUESTION_LOG_RETENTION_DAYS = 90;
const QUESTION_LOG_RETENTION_MS = 60 * 60 * 24 * 1_000 * QUESTION_LOG_RETENTION_DAYS;
const COOKIE_NAME = 'xinbao_chat_vid';
const UNAVAILABLE_MESSAGE = 'Xinbao AI is temporarily unavailable. Please try again later.';
const DAILY_LIMIT_MESSAGE = 'Daily limit reached. Please come back tomorrow.';

type ChatLanguage = 'en' | 'zh';
type ChatResponseMode = 'model-grounded' | 'model-conversational' | 'deterministic-abstention';
type ParsedChatBody = { message?: unknown; language?: ChatLanguage };
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
  outcome: 'ok' | 'ok-conversational' | 'deterministic-abstention' | 'invalid-citations' | 'protected-output' | 'retry-rate-limited' | 'invalid-conversational-reply' | 'upstream-error' | 'empty-reply' | 'timeout' | 'request-error';
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
  finalValidationFailure?: GroundedValidationFailure;
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
  cookie?: { visitorId: string; shouldSet: boolean }
) {
  const response = NextResponse.json(body, { status });
  response.headers.set('Cache-Control', 'private, no-store');
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

function genericUnavailable(cookie?: { visitorId: string; shouldSet: boolean }) {
  return jsonResponse({ error: UNAVAILABLE_MESSAGE }, 503, cookie);
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
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || '0.0.0.0';
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
    `xinbao-chat:daily:${dateKey}:visitor:${identity.visitorHash}`,
    `xinbao-chat:daily:${dateKey}:browser:${identity.browserHash}`
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

function inferLanguage(request: NextRequest): ChatLanguage {
  const referer = request.headers.get('referer') || '';
  return /_zh(?:\/|\?|#|$)|\/Qiao_Xinbao_zh\//.test(referer) ? 'zh' : 'en';
}

async function parseBody(request: NextRequest) {
  try {
    const value = await request.json() as unknown;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const body = value as Record<string, unknown>;
    return {
      message: body.message,
      language: body.language === 'en' || body.language === 'zh' ? body.language : undefined
    } satisfies ParsedChatBody;
  } catch {
    return null;
  }
}

function logServerIssue(type: string, status?: number) {
  if (status) {
    console.error(`[chat-with-xinbao] ${type}: ${status}`);
    return;
  }
  console.error(`[chat-with-xinbao] ${type}`);
}

function providerName(baseUrl: string) {
  try {
    const hostname = new URL(baseUrl).hostname.toLocaleLowerCase();
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
  console.info('[chat-with-xinbao] completion', JSON.stringify(observation));
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
    promptVersion: XINBAO_CHAT_PROMPT_VERSION,
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
  const dayKey = `xinbao-chat:questions:day:${dateKey}`;
  const frequencyKey = `xinbao-chat:questions:frequency:${language}:${dateKey}`;
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

function withXinbaoSignature(reply: string, language: ChatLanguage) {
  const signature = language === 'zh' ? '喵~' : ' meow~';
  const trimmed = reply.trim();
  const unsigned = trimmed
    .replace(/\s*(?:喵~|meow~)\s*$/i, '')
    .trim()
    .replace(/[。！？.!?]+$/u, '');
  if (!unsigned) return signature.trim();
  return `${unsigned}${signature}`;
}

export async function GET(request: NextRequest) {
  const visitorCookie = getVisitorId(request);
  const redis = getRedis();
  if (!redis || !process.env.RATE_LIMIT_SALT) {
    logServerIssue('missing quota configuration');
    return genericUnavailable(visitorCookie);
  }

  const identity = getRequestIdentity(request, visitorCookie.visitorId);
  if (!identity) return genericUnavailable(visitorCookie);

  const dailyUsage = await readDailyUsage(redis, dailyQuotaKeys(tokyoDateKey(), identity));
  const diagnostic = new URL(request.url).searchParams.get('diagnostic') === 'retrieval';
  const modelConfiguration = modelApiConfiguration();
  if (diagnostic && !modelConfiguration.ready) {
    logServerIssue('missing model API configuration');
    return genericUnavailable(visitorCookie);
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
      return genericUnavailable(visitorCookie);
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
        promptVersion: XINBAO_CHAT_PROMPT_VERSION,
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
  const visitorCookie = getVisitorId(request);
  const body = await parseBody(request);
  if (!body || typeof body.message !== 'string') {
    return jsonResponse({ error: 'Invalid request.' }, 400, visitorCookie);
  }

  const message = body.message.trim();
  if (!message) return jsonResponse({ error: 'Message is required.' }, 400, visitorCookie);
  if (message.length > MAX_INPUT_LENGTH) {
    return jsonResponse({ error: `Message must be ${MAX_INPUT_LENGTH} characters or fewer.` }, 400, visitorCookie);
  }

  const modelConfiguration = modelApiConfiguration();
  const redis = getRedis();
  if (!modelConfiguration.ready || !redis || !process.env.RATE_LIMIT_SALT) {
    logServerIssue('missing server configuration');
    return genericUnavailable(visitorCookie);
  }
  const chatRedis = redis;

  const identity = getRequestIdentity(request, visitorCookie.visitorId);
  if (!identity) return genericUnavailable(visitorCookie);

  const dateKey = tokyoDateKey();
  const dailyKeys = dailyQuotaKeys(dateKey, identity);
  const cooldownKey = `xinbao-chat:cooldown:${identity.visitorHash}`;
  const hourBucket = Math.floor(Date.now() / 3_600_000);
  const hourlyIpKey = `xinbao-chat:ip-hour:${identity.ipHash}:${hourBucket}`;
  const hourlyRetryKey = `xinbao-chat:retry-hour:${identity.ipHash}:${hourBucket}`;
  const quotaTtl = secondsUntilNextTokyoMidnight();

  const previousDailyCount = await readDailyUsage(redis, dailyKeys);
  if (previousDailyCount >= DAILY_LIMIT) {
    return jsonResponse({ error: DAILY_LIMIT_MESSAGE, remaining: 0, limit: DAILY_LIMIT }, 429, visitorCookie);
  }

  const cooldown = await redis.set(cooldownKey, '1', { nx: true, ex: COOLDOWN_SECONDS });
  if (cooldown !== 'OK') {
    return jsonResponse(
      {
        error: 'Please wait a few seconds before sending another message.',
        remaining: Math.max(0, DAILY_LIMIT - previousDailyCount),
        limit: DAILY_LIMIT
      },
      429,
      visitorCookie
    );
  }

  const hourlyIpCount = await redis.incr(hourlyIpKey);
  if (hourlyIpCount === 1) await redis.expire(hourlyIpKey, 60 * 60);
  if (hourlyIpCount > HOURLY_IP_LIMIT) {
    return jsonResponse(
      { error: 'Please wait before trying again.', remaining: Math.max(0, DAILY_LIMIT - previousDailyCount), limit: DAILY_LIMIT },
      429,
      visitorCookie
    );
  }

  const dailyCount = await reserveDailyUsage(redis, dailyKeys, quotaTtl);
  if (dailyCount > DAILY_LIMIT) {
    return jsonResponse({ error: DAILY_LIMIT_MESSAGE, remaining: 0, limit: DAILY_LIMIT }, 429, visitorCookie);
  }

  const { apiKey, baseUrl } = modelConfiguration;
  const provider = providerName(baseUrl);
  const language = body.language ?? inferLanguage(request);
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
    return genericUnavailable(visitorCookie);
  }

  const traceId = crypto.randomUUID();
  const requestStartedAt = Date.now();
  const responseMode: ChatResponseMode = retrieval.blockedReason
    ? 'deterministic-abstention'
    : retrieval.shouldAbstain
      ? 'model-conversational'
      : 'model-grounded';
  after(() => recordQuestionLog(redis, identity, message, pagePath, dateKey, language, retrieval, provider, responseMode));
  let terminalObserved = false;

  function observe(
    outcome: ChatObservation['outcome'],
    details: {
      finalValidationFailure?: GroundedValidationFailure;
      providerAttempts?: number;
      retryOutcome?: ChatObservation['retryOutcome'];
      retryReason?: CitationRetryReason;
      upstreamStatus?: number;
      usage?: ProviderUsage;
    } = {}
  ) {
    if (terminalObserved) return;
    terminalObserved = true;
    logChatObservation({
      traceId,
      outcome,
      provider,
      model: MODEL,
      promptVersion: XINBAO_CHAT_PROMPT_VERSION,
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
      promptVersion: XINBAO_CHAT_PROMPT_VERSION,
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
    observe('deterministic-abstention');
    return jsonResponse(
      {
        reply: withXinbaoSignature(deterministicAbstentionReply(message, language), language),
        sources: [],
        remaining: Math.max(0, DAILY_LIMIT - dailyCount),
        limit: DAILY_LIMIT,
        meta: responseMetadata(0, 0)
      },
      200,
      visitorCookie
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const systemPrompt = getXinbaoChatSystemPrompt(
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
    providerAttempts += 1;
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: message }
        ],
        temperature,
        max_tokens: MAX_OUTPUT_TOKENS,
        thinking: { type: 'disabled' },
        stream: false
      }),
      signal
    });
    if (!response.ok) return { kind: 'upstream-error', status: response.status };
    const data = (await response.json()) as CompletionResponse;
    accumulatedUsage = combinedUsage(accumulatedUsage, data.usage);
    const reply = data.choices?.[0]?.message?.content;
    if (typeof reply !== 'string' || !reply.trim()) return { kind: 'empty', usage: data.usage };
    return { kind: 'ok', reply, usage: data.usage };
  }

  async function unavailableAfterProvider(
    outcome: ChatObservation['outcome'],
    details: {
      finalValidationFailure?: GroundedValidationFailure;
      retryOutcome?: ChatObservation['retryOutcome'];
      retryReason?: CitationRetryReason;
      upstreamStatus?: number;
    } = {}
  ) {
    observe(outcome, { ...details, providerAttempts, usage: accumulatedUsage });
    await refundDailyUsage(chatRedis, dailyKeys);
    return genericUnavailable(visitorCookie);
  }

  try {
    if (responseMode === 'model-conversational') {
      const conversationalResult = await resolveConversationalReply({
        requestCompletion,
        signal: controller.signal,
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
        return unavailableAfterProvider('invalid-conversational-reply');
      }

      observe('ok-conversational', { providerAttempts, usage: accumulatedUsage });
      return jsonResponse(
        {
          reply: withXinbaoSignature(conversationalResult.reply, language),
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
      signal: controller.signal,
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

    if (groundedResult.kind === 'upstream-error') {
      return unavailableAfterProvider('upstream-error', {
        retryOutcome,
        retryReason: groundedResult.retryReason,
        upstreamStatus: groundedResult.status
      });
    }
    if (groundedResult.kind === 'empty') {
      return unavailableAfterProvider('empty-reply', {
        retryOutcome,
        retryReason: groundedResult.retryReason
      });
    }
    if (groundedResult.kind === 'protected-output') {
      return unavailableAfterProvider('protected-output', {
        finalValidationFailure: groundedResult.finalValidationFailure,
        retryOutcome,
        retryReason: groundedResult.retryReason
      });
    }
    if (groundedResult.kind === 'retry-rate-limited') {
      return unavailableAfterProvider('retry-rate-limited', {
        retryOutcome,
        retryReason: groundedResult.retryReason
      });
    }
    if (groundedResult.kind === 'invalid-citations') {
      return unavailableAfterProvider('invalid-citations', {
        finalValidationFailure: groundedResult.finalValidationFailure,
        retryOutcome,
        retryReason: groundedResult.retryReason
      });
    }

    observe('ok', {
      providerAttempts,
      retryOutcome,
      retryReason: groundedResult.retryReason,
      usage: accumulatedUsage
    });
    return jsonResponse(
      {
        reply: withXinbaoSignature(groundedResult.response.reply, language),
        sources: groundedResult.response.sources,
        remaining: Math.max(0, DAILY_LIMIT - dailyCount),
        limit: DAILY_LIMIT,
        meta: responseMetadata(groundedResult.response.sources.length, providerAttempts, groundedResult.retryReason)
      },
      200,
      visitorCookie
    );
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'AbortError';
    return unavailableAfterProvider(timedOut ? 'timeout' : 'request-error', {
      retryOutcome: activeRetryReason ? 'failed' : 'not-attempted',
      retryReason: activeRetryReason
    });
  } finally {
    clearTimeout(timeout);
  }
}
