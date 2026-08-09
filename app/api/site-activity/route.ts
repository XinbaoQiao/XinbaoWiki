import crypto from 'node:crypto';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import {
  SITE_ACTIVITY_MAP_HEIGHT,
  SITE_ACTIVITY_MAP_WIDTH,
  SITE_ACTIVITY_SCHEMA_VERSION,
  type SiteActivityCell,
  type SiteActivityPayload
} from '@/lib/site-activity';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const COOKIE_NAME = 'xinbao_site_vid';
const COMPLETE_DAYS = 30;
const DAY_MS = 86_400_000;
const CELL_DEGREES = 5;
const CELL_PUBLIC_THRESHOLD = 5;
const TOTAL_PUBLIC_THRESHOLD = 10;
const KEY_PREFIX = 'xinbao-site-activity:v1';
const MAX_ACTIVE_CELLS = 256;
const RETENTION_DAYS = 33;
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * RETENTION_DAYS;
const COOKIE_MINT_LIMIT_PER_HOUR = 4;
const COOKIE_MINT_TTL_SECONDS = 60 * 60;

type VisitorCookie = {
  digest: string;
  shouldSet: boolean;
  value: string;
};

let redisClient: Redis | null = null;

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redisClient ??= new Redis({ url, token });
  return redisClient;
}

function utcDateKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function completedDateKeys(now = new Date()) {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Array.from({ length: COMPLETE_DAYS }, (_, index) => {
    const daysAgo = COMPLETE_DAYS - index;
    return utcDateKey(new Date(today - daysAgo * DAY_MS));
  });
}

function expiryForDateKey(dateKey: string) {
  return Math.floor((Date.parse(`${dateKey}T00:00:00.000Z`) + RETENTION_DAYS * DAY_MS) / 1000);
}

function allKey(dateKey: string) {
  return `${KEY_PREFIX}:day:${dateKey}:all`;
}

function cellsIndexKey(dateKey: string) {
  return `${KEY_PREFIX}:day:${dateKey}:cells`;
}

function cellKey(dateKey: string, cellId: string) {
  return `${KEY_PREFIX}:day:${dateKey}:cell:${cellId}`;
}

function signVisitorId(visitorId: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(`site-activity-cookie:${visitorId}`).digest('hex').slice(0, 32);
}

function visitorDigest(visitorId: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(`site-activity-hll:${visitorId}`).digest('hex');
}

function safeSignatureMatch(provided: string, expected: string) {
  if (!/^[a-f0-9]{32}$/.test(provided) || provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'));
}

function getVisitorCookie(request: NextRequest, secret: string): VisitorCookie {
  const existing = request.cookies.get(COOKIE_NAME)?.value || '';
  const cookieParts = existing.split('.');
  const [visitorId, signature] = cookieParts;
  if (
    cookieParts.length === 2 &&
    /^[a-f0-9-]{36}$/i.test(visitorId || '') &&
    safeSignatureMatch(signature || '', signVisitorId(visitorId, secret))
  ) {
    return { digest: visitorDigest(visitorId, secret), shouldSet: false, value: existing };
  }

  const nextVisitorId = crypto.randomUUID();
  return {
    digest: visitorDigest(nextVisitorId, secret),
    shouldSet: true,
    value: `${nextVisitorId}.${signVisitorId(nextVisitorId, secret)}`
  };
}

function trustedRequestIp(request: NextRequest) {
  if (process.env.VERCEL !== '1') return null;
  return request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || null;
}

function cookieMintKey(requestIp: string, secret: string, now = new Date()) {
  const hour = now.toISOString().slice(0, 13);
  const digest = crypto
    .createHmac('sha256', secret)
    .update(`site-activity-cookie-mint:${requestIp}`)
    .digest('hex')
    .slice(0, 40);
  return `${KEY_PREFIX}:cookie-mint:${hour}:${digest}`;
}

async function reserveCookieMint(redis: Redis, request: NextRequest, secret: string) {
  if (process.env.VERCEL !== '1') return true;
  const requestIp = trustedRequestIp(request);
  if (!requestIp) return false;

  const key = cookieMintKey(requestIp, secret);
  const transaction = redis.multi();
  transaction.incr(key);
  transaction.expire(key, COOKIE_MINT_TTL_SECONDS);
  const [mintCount] = await transaction.exec<[number, number]>();
  return mintCount <= COOKIE_MINT_LIMIT_PER_HOUR;
}

function parseCoordinate(value: string | null, minimum: number, maximum: number) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null;
}

function quantize(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, Math.round(value / CELL_DEGREES) * CELL_DEGREES));
}

function requestCell(request: NextRequest) {
  if (process.env.VERCEL !== '1') return null;
  const latitude = parseCoordinate(request.headers.get('x-vercel-ip-latitude'), -90, 90);
  const longitude = parseCoordinate(request.headers.get('x-vercel-ip-longitude'), -180, 180);
  if (latitude === null || longitude === null) return null;
  const coarseLatitude = quantize(latitude, -55, 80);
  const coarseLongitude = quantize(longitude, -175, 175);
  return `${coarseLatitude}:${coarseLongitude}`;
}

function parseCellId(cellId: string) {
  const match = cellId.match(/^(-?\d+):(-?\d+)$/);
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (
    !Number.isInteger(latitude) ||
    !Number.isInteger(longitude) ||
    latitude < -55 ||
    latitude > 80 ||
    longitude < -175 ||
    longitude > 175 ||
    latitude % CELL_DEGREES !== 0 ||
    longitude % CELL_DEGREES !== 0
  ) {
    return null;
  }
  return { latitude, longitude };
}

function projectCell(cellId: string, count: number): SiteActivityCell | null {
  const coordinates = parseCellId(cellId);
  if (!coordinates || count < CELL_PUBLIC_THRESHOLD) return null;
  const x = ((coordinates.longitude + 180) / 360) * SITE_ACTIVITY_MAP_WIDTH;
  const y = ((82 - coordinates.latitude) / 140) * SITE_ACTIVITY_MAP_HEIGHT;
  return {
    level: count >= 25 ? 3 : count >= 10 ? 2 : 1,
    x: Math.round(x),
    y: Math.round(y)
  };
}

function cellSelectionScore(cellId: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(`site-activity-cell-selection:${cellId}`).digest('hex');
}

function publicEstimate(count: number) {
  if (count < TOTAL_PUBLIC_THRESHOLD) return null;
  return Math.max(TOTAL_PUBLIC_THRESHOLD, Math.round(count / 5) * 5);
}

function emptyPayload(enabled: boolean, now = new Date()): SiteActivityPayload {
  const dateKeys = completedDateKeys(now);
  return {
    cells: [],
    enabled,
    generatedAt: now.toISOString(),
    schemaVersion: SITE_ACTIVITY_SCHEMA_VERSION,
    thresholds: { cell: CELL_PUBLIC_THRESHOLD, total: TOTAL_PUBLIC_THRESHOLD },
    timezone: 'UTC',
    uniqueBrowsersEstimate: null,
    window: {
      completeDays: COMPLETE_DAYS,
      end: dateKeys.at(-1) || '',
      start: dateKeys[0] || ''
    }
  };
}

function publicJson(payload: SiteActivityPayload) {
  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=900'
    }
  });
}

function privateResponse(status: number) {
  return new NextResponse(null, {
    status,
    headers: { 'Cache-Control': 'private, no-store' }
  });
}

function sameOriginRequest(request: NextRequest) {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'same-site' && fetchSite !== 'none') return false;
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

function setVisitorCookie(response: NextResponse, visitor: VisitorCookie) {
  if (!visitor.shouldSet) return;
  response.cookies.set(COOKIE_NAME, visitor.value, {
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
}

function logSiteActivityIssue(message: string) {
  console.error(`[site-activity] ${message}`);
}

export async function POST(request: NextRequest) {
  if (!sameOriginRequest(request)) return privateResponse(403);
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (!Number.isFinite(contentLength) || contentLength > 0) return privateResponse(400);

  const redis = getRedis();
  const secret = process.env.RATE_LIMIT_SALT;
  if (!redis || !secret) return privateResponse(204);

  const visitor = getVisitorCookie(request, secret);
  const dateKey = utcDateKey(new Date());
  const expiresAt = expiryForDateKey(dateKey);
  const cellId = requestCell(request);

  try {
    if (visitor.shouldSet && !(await reserveCookieMint(redis, request, secret))) {
      return privateResponse(204);
    }

    const transaction = redis.multi();
    transaction.pfadd(allKey(dateKey), visitor.digest);
    transaction.expireat(allKey(dateKey), expiresAt);
    if (cellId) {
      transaction.pfadd(cellKey(dateKey, cellId), visitor.digest);
      transaction.expireat(cellKey(dateKey, cellId), expiresAt);
      transaction.sadd(cellsIndexKey(dateKey), cellId);
      transaction.expireat(cellsIndexKey(dateKey), expiresAt);
    }
    await transaction.exec();
  } catch {
    logSiteActivityIssue('visit aggregation failed');
    return privateResponse(204);
  }

  const response = privateResponse(204);
  setVisitorCookie(response, visitor);
  return response;
}

export async function GET(request: NextRequest) {
  if (new URL(request.url).search) return privateResponse(400);

  const now = new Date();
  const empty = emptyPayload(false, now);
  const redis = getRedis();
  const secret = process.env.RATE_LIMIT_SALT;
  if (!redis || !secret) return publicJson(empty);

  const dateKeys = completedDateKeys(now);
  try {
    const indexPipeline = redis.pipeline();
    for (const dateKey of dateKeys) indexPipeline.smembers(cellsIndexKey(dateKey));
    const dailyCells = await indexPipeline.exec<string[][]>();
    const cellIds = [...new Set(dailyCells.flat().filter((cellId) => parseCellId(cellId)))]
      .sort((left, right) => cellSelectionScore(left, secret).localeCompare(cellSelectionScore(right, secret)))
      .slice(0, MAX_ACTIVE_CELLS);

    const countPipeline = redis.pipeline();
    const [firstAllKey, ...remainingAllKeys] = dateKeys.map(allKey);
    countPipeline.pfcount(firstAllKey, ...remainingAllKeys);
    for (const cellId of cellIds) {
      const [firstCellKey, ...remainingCellKeys] = dateKeys.map((dateKey) => cellKey(dateKey, cellId));
      countPipeline.pfcount(firstCellKey, ...remainingCellKeys);
    }
    const counts = await countPipeline.exec<number[]>();
    const uniqueBrowsersEstimate = publicEstimate(Number(counts[0]) || 0);
    const cells = uniqueBrowsersEstimate === null
      ? []
      : cellIds
        .map((cellId, index) => projectCell(cellId, Number(counts[index + 1]) || 0))
        .filter((cell): cell is SiteActivityCell => Boolean(cell));

    return publicJson({
      ...emptyPayload(true, now),
      cells,
      uniqueBrowsersEstimate
    });
  } catch {
    logSiteActivityIssue('public aggregation read failed');
    return privateResponse(503);
  }
}
