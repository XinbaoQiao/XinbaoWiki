import crypto from 'node:crypto';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const QUESTION_LOG_RECENT_KEY = 'xinbao-chat:questions:recent';
const DEFAULT_EXPORT_LIMIT = 100;
const MAX_EXPORT_LIMIT = 500;

let redisClient: Redis | null = null;

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redisClient ??= new Redis({ url, token });
  return redisClient;
}

function tokenDigest(value: string) {
  return crypto.createHash('sha256').update(value).digest();
}

function isAuthorized(request: NextRequest) {
  const expected = process.env.XINBAO_CHAT_ADMIN_TOKEN;
  if (!expected) return false;
  const authorization = request.headers.get('authorization') || '';
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  const provided = bearer || request.headers.get('x-xinbao-chat-admin-token') || '';
  if (!provided) return false;
  return crypto.timingSafeEqual(tokenDigest(provided), tokenDigest(expected));
}

function parseLimit(request: NextRequest) {
  const raw = new URL(request.url).searchParams.get('limit');
  const value = raw ? Number(raw) : DEFAULT_EXPORT_LIMIT;
  if (!Number.isFinite(value)) return DEFAULT_EXPORT_LIMIT;
  return Math.max(1, Math.min(MAX_EXPORT_LIMIT, Math.floor(value)));
}

function parseQuestionLog(value: unknown) {
  if (typeof value !== 'string') return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function dateKeyFromRequest(request: NextRequest) {
  const date = new URL(request.url).searchParams.get('date');
  return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
}

function languageFromRequest(request: NextRequest) {
  return new URL(request.url).searchParams.get('language') === 'en' ? 'en' : 'zh';
}

function frequencyItems(raw: unknown[]) {
  const items: Array<{ question: unknown; count: number }> = [];
  for (let index = 0; index < raw.length; index += 2) {
    items.push({ question: raw[index], count: Number(raw[index + 1]) || 0 });
  }
  return items;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ error: 'Question logging is not configured.' }, { status: 503 });
  }

  const url = new URL(request.url);
  const limit = parseLimit(request);
  const mode = url.searchParams.get('mode');

  if (mode === 'frequency') {
    const language = languageFromRequest(request);
    const raw = await redis.zrange<unknown[]>(`xinbao-chat:questions:frequency:${language}`, 0, limit - 1, {
      rev: true,
      withScores: true
    });
    return NextResponse.json({ mode, language, limit, items: frequencyItems(raw) });
  }

  const dateKey = dateKeyFromRequest(request);
  const key = dateKey ? `xinbao-chat:questions:day:${dateKey}` : QUESTION_LOG_RECENT_KEY;
  const rawItems = await redis.lrange<string>(key, 0, limit - 1);
  return NextResponse.json({
    mode: dateKey ? 'day' : 'recent',
    date: dateKey || null,
    limit,
    items: rawItems.map(parseQuestionLog).filter(Boolean)
  });
}
