import crypto from 'node:crypto';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import {
  SITE_ACTIVITY_MAP_HEIGHT,
  SITE_ACTIVITY_MAP_WIDTH,
  SITE_ACTIVITY_SCHEMA_VERSION,
  SITE_ACTIVITY_SINCE,
  shouldRecordSiteActivityRequest,
  type SiteActivityCell,
  type SiteActivityPayload
} from '@/lib/site-activity';
import {
  migrateLegacySiteActivity,
  publicSiteActivityEstimate,
  publicSiteActivityLevel,
  SITE_ACTIVITY_CELL_THRESHOLD,
  SITE_ACTIVITY_KEY_PREFIX,
  SITE_ACTIVITY_MAX_CELLS,
  SITE_ACTIVITY_TOTAL_THRESHOLD,
  siteActivityAggregationKeys
} from '@/lib/site-activity-aggregation';
import {
  isSiteActivityBrowserExcluded,
  SITE_ACTIVITY_EXCLUSION_COOKIE_NAME,
  SITE_ACTIVITY_VISITOR_COOKIE_NAME
} from '@/lib/site-activity-preference';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const COOKIE_NAME = SITE_ACTIVITY_VISITOR_COOKIE_NAME;
const COOKIE_VERSION = 'v2';
const CELL_DEGREES = 5;
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;
const COOKIE_MINT_LIMIT_PER_HOUR = 4;
const COOKIE_MINT_TTL_SECONDS = 60 * 60;

type VisitorCookie = {
  digest: string;
  requiresMintReservation: boolean;
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
  const versioned = cookieParts.length === 3 && cookieParts[0] === COOKIE_VERSION;
  const legacy = cookieParts.length === 2;
  const visitorId = versioned ? cookieParts[1] : cookieParts[0];
  const signature = versioned ? cookieParts[2] : cookieParts[1];
  if (
    (versioned || legacy) &&
    /^[a-f0-9-]{36}$/i.test(visitorId || '') &&
    safeSignatureMatch(signature || '', signVisitorId(visitorId, secret))
  ) {
    return {
      digest: visitorDigest(visitorId, secret),
      requiresMintReservation: false,
      shouldSet: legacy,
      value: legacy ? `${COOKIE_VERSION}.${visitorId}.${signature}` : existing
    };
  }

  const nextVisitorId = crypto.randomUUID();
  return {
    digest: visitorDigest(nextVisitorId, secret),
    requiresMintReservation: true,
    shouldSet: true,
    value: `${COOKIE_VERSION}.${nextVisitorId}.${signVisitorId(nextVisitorId, secret)}`
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
  return `${SITE_ACTIVITY_KEY_PREFIX}:cookie-mint:${hour}:${digest}`;
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
  const level = publicSiteActivityLevel(count);
  if (!coordinates || level === null) return null;
  const x = ((coordinates.longitude + 180) / 360) * SITE_ACTIVITY_MAP_WIDTH;
  const y = ((82 - coordinates.latitude) / 140) * SITE_ACTIVITY_MAP_HEIGHT;
  return {
    level,
    x: Math.round(x),
    y: Math.round(y)
  };
}

function cellSelectionScore(cellId: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(`site-activity-cell-selection:${cellId}`).digest('hex');
}

function emptyPayload(enabled: boolean, now = new Date()): SiteActivityPayload {
  return {
    cells: [],
    enabled,
    generatedAt: now.toISOString(),
    period: { scope: 'lifetime', since: SITE_ACTIVITY_SINCE },
    schemaVersion: SITE_ACTIVITY_SCHEMA_VERSION,
    thresholds: { cell: SITE_ACTIVITY_CELL_THRESHOLD, total: SITE_ACTIVITY_TOTAL_THRESHOLD },
    uniqueBrowsersEstimate: null
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

function shouldRecordVisit(request: NextRequest) {
  return shouldRecordSiteActivityRequest({
    hostname: new URL(request.url).hostname,
    testMode: process.env.SITE_ACTIVITY_TEST_MODE === 'true',
    userAgent: request.headers.get('user-agent')
  });
}

async function acceptsEmptyBody(request: NextRequest) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (!Number.isFinite(contentLength) || contentLength < 0 || contentLength > 0) return false;
  try {
    return (await request.arrayBuffer()).byteLength === 0;
  } catch {
    return false;
  }
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
  if (!shouldRecordVisit(request)) return privateResponse(204);
  if (!sameOriginRequest(request)) return privateResponse(403);
  if (!(await acceptsEmptyBody(request))) return privateResponse(400);

  const secret = process.env.RATE_LIMIT_SALT;
  if (secret && isSiteActivityBrowserExcluded(request.cookies.get(SITE_ACTIVITY_EXCLUSION_COOKIE_NAME)?.value, secret)) {
    return privateResponse(204);
  }
  const redis = getRedis();
  if (!redis || !secret) return privateResponse(204);

  const visitor = getVisitorCookie(request, secret);
  const cellId = requestCell(request);

  try {
    if (visitor.requiresMintReservation && !(await reserveCookieMint(redis, request, secret))) {
      return privateResponse(204);
    }
    try {
      await migrateLegacySiteActivity(redis, secret, SITE_ACTIVITY_SINCE);
    } catch {
      logSiteActivityIssue('legacy aggregate migration failed');
    }

    const transaction = redis.multi();
    transaction.pfadd(siteActivityAggregationKeys.lifetimeAll(), visitor.digest);
    if (cellId) {
      transaction.pfadd(siteActivityAggregationKeys.lifetimeCell(cellId), visitor.digest);
      transaction.sadd(siteActivityAggregationKeys.lifetimeCellsIndex(), cellId);
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

  try {
    await migrateLegacySiteActivity(redis, secret, SITE_ACTIVITY_SINCE, now);
  } catch {
    logSiteActivityIssue('legacy aggregate migration failed');
  }

  try {
    const activeCells = await redis.smembers(siteActivityAggregationKeys.lifetimeCellsIndex());
    const cellIds = [...new Set(activeCells.filter((cellId) => parseCellId(cellId)))]
      .sort((left, right) => cellSelectionScore(left, secret).localeCompare(cellSelectionScore(right, secret)))
      .slice(0, SITE_ACTIVITY_MAX_CELLS);

    const countPipeline = redis.pipeline();
    countPipeline.pfcount(siteActivityAggregationKeys.lifetimeAll());
    for (const cellId of cellIds) countPipeline.pfcount(siteActivityAggregationKeys.lifetimeCell(cellId));
    const counts = await countPipeline.exec<number[]>();
    const uniqueBrowsersEstimate = publicSiteActivityEstimate(Number(counts[0]) || 0);
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
