import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import {
  isSiteActivityBrowserExcluded,
  SITE_ACTIVITY_EXCLUSION_COOKIE_NAME,
  SITE_ACTIVITY_PREFERENCE_COOKIE_MAX_AGE_SECONDS,
  siteActivityExclusionCookieValue
} from '@/lib/site-activity-preference';
import {
  isSiteActivityOwnerPasswordHash,
  reserveSiteActivityOwnerRateLimit,
  siteActivityOwnerRateLimitKey,
  verifySiteActivityOwnerPassword
} from '@/lib/site-activity-owner-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function privateJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' }
  });
}

function privateResponse(status: number, headers?: Record<string, string>) {
  return new NextResponse(null, {
    status,
    headers: { 'Cache-Control': 'private, no-store', ...headers }
  });
}

function sameOriginRequest(request: NextRequest) {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'same-site' && fetchSite !== 'none') return false;
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

function ownerPasswordHash() {
  return process.env.SITE_ACTIVITY_OWNER_PASSWORD_HASH;
}

let redisClient: Redis | null = null;

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redisClient ??= new Redis({ url, token });
  return redisClient;
}

function preferenceConfigured() {
  return Boolean(
    process.env.RATE_LIMIT_SALT &&
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN &&
    isSiteActivityOwnerPasswordHash(ownerPasswordHash())
  );
}

type ParsedPreferenceBody = { password: string; excluded: boolean };

async function readCappedBody(request: NextRequest, maximumBytes: number) {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const buffer = new Uint8Array(maximumBytes);
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (length + value.byteLength > maximumBytes) {
        await reader.cancel();
        return null;
      }
      buffer.set(value, length);
      length += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }
  return length > 0 ? buffer.subarray(0, length) : null;
}

async function parsePreferenceBody(request: NextRequest): Promise<ParsedPreferenceBody | null> {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (!Number.isFinite(contentLength) || contentLength < 0 || contentLength > 512) return null;
  const contentType = request.headers.get('content-type') || '';
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) return null;
  try {
    const body = await readCappedBody(request, 512);
    if (!body) return null;
    const text = new TextDecoder('utf-8', { fatal: true }).decode(body);
    const value: unknown = JSON.parse(text);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const keys = Object.keys(value);
    if (keys.length !== 2 || !keys.includes('password') || !keys.includes('excluded')) return null;
    const parsed = value as { password?: unknown; excluded?: unknown };
    if (typeof parsed.password !== 'string' || typeof parsed.excluded !== 'boolean') return null;
    const passwordLength = Buffer.byteLength(parsed.password, 'utf8');
    if (passwordLength < 8 || passwordLength > 256) return null;
    return { password: parsed.password, excluded: parsed.excluded };
  } catch {
    return null;
  }
}

function cookieOptions() {
  return {
    httpOnly: true,
    maxAge: SITE_ACTIVITY_PREFERENCE_COOKIE_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production'
  };
}

export async function GET(request: NextRequest) {
  const secret = process.env.RATE_LIMIT_SALT;
  const excluded = secret
    ? isSiteActivityBrowserExcluded(request.cookies.get(SITE_ACTIVITY_EXCLUSION_COOKIE_NAME)?.value, secret)
    : false;
  return privateJson({ enabled: preferenceConfigured(), excluded });
}

export async function POST(request: NextRequest) {
  if (!sameOriginRequest(request)) return privateResponse(403);
  const body = await parsePreferenceBody(request);
  if (!body) return privateResponse(400);
  const secret = process.env.RATE_LIMIT_SALT;
  const passwordHash = ownerPasswordHash();
  if (!secret || !preferenceConfigured()) return privateResponse(503);

  if (process.env.VERCEL === '1') {
    const requestIp = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim();
    try {
      const redis = getRedis();
      if (!redis || !requestIp) return privateResponse(503);
      const now = Date.now();
      const reservation = await reserveSiteActivityOwnerRateLimit(
        redis,
        siteActivityOwnerRateLimitKey(requestIp, secret, now),
        now
      );
      if (!reservation.allowed) {
        return privateResponse(429, { 'Retry-After': String(reservation.retryAfterSeconds) });
      }
    } catch {
      return privateResponse(503);
    }
  }

  let passwordAccepted = false;
  try {
    passwordAccepted = await verifySiteActivityOwnerPassword(body.password, passwordHash);
  } catch {
    return privateResponse(503);
  }
  if (!passwordAccepted) return privateResponse(401);

  const response = NextResponse.json(
    { excluded: body.excluded },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
  response.cookies.set(
    SITE_ACTIVITY_EXCLUSION_COOKIE_NAME,
    body.excluded ? siteActivityExclusionCookieValue(secret) : '',
    body.excluded ? cookieOptions() : { ...cookieOptions(), maxAge: 0 }
  );
  return response;
}
