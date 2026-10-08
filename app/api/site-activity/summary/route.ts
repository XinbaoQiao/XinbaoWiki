import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import { isActivityReportAuthorized, readDailyActivity, siteActivityDateKey, siteActivityDateRange } from '@/lib/site-activity-daily';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
let redisClient: Redis | null = null;

function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
}

export async function GET(request: NextRequest) {
  // Use the existing maintainer credential; never accept credentials in URLs or cookies.
  if (!isActivityReportAuthorized(request.headers, process.env.XINBAO_CHAT_ADMIN_TOKEN)) return privateJson({ error: 'Unauthorized.' }, 401);
  const url = new URL(request.url);
  const now = new Date();
  if ([...url.searchParams.keys()].some((key) => !['start', 'end', 'days'].includes(key)) || ['start', 'end', 'days'].some((key) => url.searchParams.getAll(key).length > 1)) return privateJson({ error: 'Invalid report range.' }, 400);
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');
  const rawDays = url.searchParams.get('days') ?? '7';
  if ((url.searchParams.has('start') || url.searchParams.has('end')) && (!start || !end || url.searchParams.has('days'))) return privateJson({ error: 'Use start and end, or days.' }, 400);
  if (!start && !/^(?:[1-9]|[1-8][0-9]|90)$/.test(rawDays)) return privateJson({ error: 'Days must be between 1 and 90.' }, 400);
  const last = end || siteActivityDateKey(now);
  const first = start || new Date(Date.parse(`${last}T00:00:00Z`) - (Number(rawDays) - 1) * 86_400_000).toISOString().slice(0, 10);
  const dates = siteActivityDateRange(first, last, now);
  if (!dates) return privateJson({ error: 'Range must be within the most recent 90 calendar days.' }, 400);
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisAuth = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisAuth) return privateJson({ error: 'Activity reporting is not configured.' }, 503);
  try {
    redisClient ??= new Redis({ url: redisUrl, token: redisAuth });
    return privateJson(await readDailyActivity(redisClient, dates));
  } catch {
    console.error('[site-activity] private daily report failed');
    return privateJson({ error: 'Activity reporting is temporarily unavailable.' }, 503);
  }
}
