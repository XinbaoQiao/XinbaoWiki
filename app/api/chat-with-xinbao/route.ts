import crypto from 'node:crypto';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import { getXinbaoChatSystemPrompt } from '@/lib/chat-with-xinbao';

export const runtime = 'nodejs';

const MODEL = 'deepseek-v4-flash';
const DEFAULT_BASE_URL = 'https://api.yunwu.ai/v1';
const DAILY_LIMIT = 20;
const COOLDOWN_SECONDS = 4;
const HOURLY_IP_LIMIT = 80;
const MAX_INPUT_LENGTH = 1000;
const MAX_HISTORY_MESSAGES = 6;
const MAX_OUTPUT_TOKENS = 450;
const REQUEST_TIMEOUT_MS = 12_000;
const QUESTION_LOG_MAX_RECENT = 2_000;
const QUESTION_LOG_RETENTION_DAYS = 90;
const QUESTION_LOG_MESSAGE_LENGTH = 1_000;
const COOKIE_NAME = 'xinbao_chat_vid';
const UNAVAILABLE_MESSAGE = 'Xinbao AI is temporarily unavailable. Please try again later.';
const DAILY_LIMIT_MESSAGE = 'Daily limit reached. Please come back tomorrow.';
const QUESTION_LOG_RECENT_KEY = 'xinbao-chat:questions:recent';

type ChatRole = 'user' | 'assistant';
type ChatMessage = { role: ChatRole; content: string };
type CompletionResponse = { choices?: Array<{ message?: { content?: unknown } }> };
type RequestIdentity = { visitorHash: string; browserHash: string; ipHash: string };
type QuestionLogEntry = {
  id: string;
  createdAt: string;
  dateKey: string;
  language: 'en' | 'zh';
  message: string;
  normalized: string;
  messageLength: number;
  pagePath: string;
  visitorHash: string;
  browserHash: string;
  ipHash: string;
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

async function incrementDailyUsage(redis: Redis, keys: string[], ttl: number) {
  const counts = await Promise.all(keys.map(async (key) => {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, ttl);
    return count;
  }));
  return Math.max(...counts);
}

function inferLanguage(request: NextRequest): 'en' | 'zh' {
  const referer = request.headers.get('referer') || '';
  return /_zh(?:\/|\?|#|$)|\/Qiao_Xinbao_zh\//.test(referer) ? 'zh' : 'en';
}

function sanitizeHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter((item): item is ChatMessage => {
      if (!item || typeof item !== 'object') return false;
      const value = item as Partial<ChatMessage>;
      return (value.role === 'user' || value.role === 'assistant') && typeof value.content === 'string';
    })
    .map((item) => ({ role: item.role, content: item.content.trim().slice(0, MAX_INPUT_LENGTH) }))
    .filter((item) => item.content.length > 0)
    .slice(-MAX_HISTORY_MESSAGES);
}

async function parseBody(request: NextRequest) {
  try {
    return (await request.json()) as { message?: unknown; history?: unknown };
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

function normalizeQuestion(message: string) {
  return message.replace(/\s+/g, ' ').trim().toLocaleLowerCase().slice(0, 240);
}

async function recordQuestionLog(
  redis: Redis,
  identity: RequestIdentity,
  message: string,
  request: NextRequest,
  dateKey: string,
  language: 'en' | 'zh'
) {
  const entry: QuestionLogEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    dateKey,
    language,
    message: message.slice(0, QUESTION_LOG_MESSAGE_LENGTH),
    normalized: normalizeQuestion(message),
    messageLength: message.length,
    pagePath: sanitizeRefererPath(request),
    visitorHash: identity.visitorHash,
    browserHash: identity.browserHash,
    ipHash: identity.ipHash
  };
  const payload = JSON.stringify(entry);
  const dayKey = `xinbao-chat:questions:day:${dateKey}`;
  const frequencyKey = `xinbao-chat:questions:frequency:${language}`;
  const retentionTtl = 60 * 60 * 24 * QUESTION_LOG_RETENTION_DAYS;

  try {
    await Promise.all([
      redis.lpush(QUESTION_LOG_RECENT_KEY, payload),
      redis.ltrim(QUESTION_LOG_RECENT_KEY, 0, QUESTION_LOG_MAX_RECENT - 1),
      redis.lpush(dayKey, payload),
      redis.expire(dayKey, retentionTtl),
      redis.zincrby(frequencyKey, 1, entry.normalized)
    ]);
  } catch {
    logServerIssue('question log write failed');
  }
}

function withXinbaoSignature(reply: string, language: 'en' | 'zh') {
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
  return jsonResponse(
    { remaining: Math.max(0, DAILY_LIMIT - dailyUsage), limit: DAILY_LIMIT },
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

  const apiKey = process.env.YUNWU_API_KEY;
  const redis = getRedis();
  if (!apiKey || !redis || !process.env.RATE_LIMIT_SALT) {
    logServerIssue('missing server configuration');
    return genericUnavailable(visitorCookie);
  }

  const identity = getRequestIdentity(request, visitorCookie.visitorId);
  if (!identity) return genericUnavailable(visitorCookie);

  const dateKey = tokyoDateKey();
  const dailyKeys = dailyQuotaKeys(dateKey, identity);
  const cooldownKey = `xinbao-chat:cooldown:${identity.visitorHash}`;
  const hourlyIpKey = `xinbao-chat:ip-hour:${identity.ipHash}:${Math.floor(Date.now() / 3_600_000)}`;
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

  const dailyCount = await incrementDailyUsage(redis, dailyKeys, quotaTtl);
  if (dailyCount > DAILY_LIMIT) {
    return jsonResponse({ error: DAILY_LIMIT_MESSAGE, remaining: 0, limit: DAILY_LIMIT }, 429, visitorCookie);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const baseUrl = (process.env.YUNWU_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  const language = inferLanguage(request);
  await recordQuestionLog(redis, identity, message, request, dateKey, language);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: getXinbaoChatSystemPrompt(language) },
          ...sanitizeHistory(body.history),
          { role: 'user', content: message }
        ],
        temperature: 0.3,
        max_tokens: MAX_OUTPUT_TOKENS,
        thinking: { type: 'disabled' },
        stream: false
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      logServerIssue('model response status', response.status);
      return genericUnavailable(visitorCookie);
    }

    const data = (await response.json()) as CompletionResponse;
    const reply = data.choices?.[0]?.message?.content;
    if (typeof reply !== 'string' || !reply.trim()) {
      logServerIssue('empty model reply');
      return genericUnavailable(visitorCookie);
    }

    return jsonResponse(
      { reply: withXinbaoSignature(reply, language), remaining: Math.max(0, DAILY_LIMIT - dailyCount), limit: DAILY_LIMIT },
      200,
      visitorCookie
    );
  } catch (error) {
    logServerIssue(error instanceof DOMException && error.name === 'AbortError' ? 'model timeout' : 'model request failed');
    return genericUnavailable(visitorCookie);
  } finally {
    clearTimeout(timeout);
  }
}
