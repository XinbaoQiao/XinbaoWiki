import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import { isActivityReportAuthorized, siteActivityDateKey } from '@/lib/site-activity-daily';
import { readActivityEvents, validActivityEventDate, SITE_ACTIVITY_EVENT_MAX_PER_DAY } from '@/lib/site-activity-events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
let redisClient: Redis | null = null;

function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
}

export async function GET(request: NextRequest) {
  if (!isActivityReportAuthorized(request.headers, process.env.XINBAO_CHAT_ADMIN_TOKEN)) return privateJson({ error: 'Unauthorized.' }, 401);
  const params = new URL(request.url).searchParams;
  const allowed = ['date', 'limit', 'offset', 'snapshot'];
  if ([...params.keys()].some(key => !allowed.includes(key)) || allowed.some(key => params.getAll(key).length > 1)) return privateJson({ error: 'Invalid event range.' }, 400);
  const now = new Date();
  const date = params.get('date') ?? siteActivityDateKey(now);
  const integer = (name: string, fallback: string) => {
    const value = params.get(name) ?? fallback;
    return /^(?:0|[1-9]\d{0,4})$/.test(value) ? Number(value) : NaN;
  };
  const limit = integer('limit', '100');
  const offset = integer('offset', '0');
  const snapshot = params.has('snapshot') ? integer('snapshot', '') : undefined;
  if (!validActivityEventDate(date, now) || !Number.isInteger(limit) || limit < 1 || limit > 200 || !Number.isInteger(offset)
    || offset > SITE_ACTIVITY_EVENT_MAX_PER_DAY || (snapshot !== undefined && (!Number.isInteger(snapshot) || snapshot < offset || snapshot > SITE_ACTIVITY_EVENT_MAX_PER_DAY))) {
    return privateJson({ error: 'Invalid event range.' }, 400);
  }
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisAuth = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisAuth) return privateJson({ error: 'Activity reporting is not configured.' }, 503);
  try {
    redisClient ??= new Redis({ url: redisUrl, token: redisAuth });
    return privateJson(await readActivityEvents(redisClient, date, limit, offset, snapshot, now));
  } catch {
    console.error('[site-activity] private event report failed');
    return privateJson({ error: 'Event report or snapshot is unavailable.' }, 503);
  }
}
