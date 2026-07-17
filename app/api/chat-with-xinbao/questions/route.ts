import crypto from 'node:crypto';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const DEFAULT_EXPORT_LIMIT = 100;
const MAX_EXPORT_LIMIT = 500;
const QUESTION_LOG_RETENTION_DAYS = 90;

let redisClient: Redis | null = null;

function noStoreJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' }
  });
}

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
  if (value && typeof value === 'object') return value;
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

function recentTokyoDateKeys(now = new Date()) {
  const { year, month, day } = tokyoDateParts(now);
  const anchor = Date.UTC(year, month - 1, day);
  return Array.from({ length: QUESTION_LOG_RETENTION_DAYS }, (_, offset) => {
    const date = new Date(anchor - offset * 86_400_000);
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  });
}

function languageFromRequest(request: NextRequest) {
  return new URL(request.url).searchParams.get('language') === 'en' ? 'en' : 'zh';
}

function frequencyItems(raw: unknown[]) {
  const items: Array<{ questionHash: unknown; count: number }> = [];
  for (let index = 0; index < raw.length; index += 2) {
    items.push({ questionHash: raw[index], count: Number(raw[index + 1]) || 0 });
  }
  return items;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return noStoreJson({ error: 'Unauthorized.' }, 401);
  }

  const redis = getRedis();
  if (!redis) {
    return noStoreJson({ error: 'Question logging is not configured.' }, 503);
  }

  const url = new URL(request.url);
  const limit = parseLimit(request);
  const mode = url.searchParams.get('mode');

  if (mode === 'frequency') {
    const language = languageFromRequest(request);
    const dateKeys = recentTokyoDateKeys();
    const pipeline = redis.pipeline();
    for (const dateKey of dateKeys) {
      pipeline.zrange(`xinbao-chat:questions:frequency:${language}:${dateKey}`, 0, -1, { withScores: true });
    }
    const buckets = await pipeline.exec<unknown[][]>();
    const counts = new Map<string, number>();
    for (const bucket of buckets) {
      for (const item of frequencyItems(bucket)) {
        if (typeof item.questionHash !== 'string' || !item.questionHash) continue;
        counts.set(item.questionHash, (counts.get(item.questionHash) || 0) + item.count);
      }
    }
    const items = [...counts.entries()]
      .map(([questionHash, count]) => ({ questionHash, count }))
      .sort((left, right) => right.count - left.count || left.questionHash.localeCompare(right.questionHash))
      .slice(0, limit);
    return noStoreJson({ mode, language, limit, items });
  }

  const dateKey = dateKeyFromRequest(request);
  let rawItems: unknown[];
  if (dateKey) {
    rawItems = await redis.lrange(`xinbao-chat:questions:day:${dateKey}`, 0, limit - 1);
  } else {
    const pipeline = redis.pipeline();
    for (const recentDateKey of recentTokyoDateKeys()) {
      pipeline.lrange(`xinbao-chat:questions:day:${recentDateKey}`, 0, limit - 1);
    }
    const buckets = await pipeline.exec<unknown[][]>();
    rawItems = buckets.flat().slice(0, limit);
  }
  return noStoreJson({
    mode: dateKey ? 'day' : 'recent',
    date: dateKey || null,
    limit,
    items: rawItems.map(parseQuestionLog).filter(Boolean).slice(0, limit)
  });
}
