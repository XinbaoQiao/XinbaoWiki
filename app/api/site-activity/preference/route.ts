import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import { ownerNetworkContext, recordOwnerAction } from '@/lib/site-activity-owner-records';
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
    headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' }
  });
}

function privateResponse(status: number, headers?: Record<string, string>) {
  return new NextResponse(null, {
    status,
    headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', ...headers }
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
  const redisAuth = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !redisAuth) return null;
  redisClient ??= new Redis({ url, token: redisAuth, retry: false, signal: () => AbortSignal.timeout(2_000) });
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

type ParsedPreferenceBody = { password: string; excluded: boolean } | { password: string; inspect: true };

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
    if (keys.length !== 2 || !keys.includes('password')) return null;
    const parsed = value as { password?: unknown; excluded?: unknown; inspect?: unknown };
    if (typeof parsed.password !== 'string') return null;
    const inspecting = keys.includes('inspect') && parsed.inspect === true;
    if (!inspecting && (!keys.includes('excluded') || typeof parsed.excluded !== 'boolean')) return null;
    const passwordLength = Buffer.byteLength(parsed.password, 'utf8');
    if (passwordLength < 8 || passwordLength > 256) return null;
    const { password, excluded } = parsed;
    return inspecting ? { password, inspect: true } : { password, excluded: excluded as boolean };
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
  const activitySalt = process.env.RATE_LIMIT_SALT;
  const excluded = activitySalt
    ? isSiteActivityBrowserExcluded(request.cookies.get(SITE_ACTIVITY_EXCLUSION_COOKIE_NAME)?.value, activitySalt)
    : false;
  return privateJson({ enabled: preferenceConfigured(), excluded });
}

export async function POST(request: NextRequest) {
  if (!sameOriginRequest(request)) return privateResponse(403);
  const body = await parsePreferenceBody(request);
  if (!body) return privateResponse(400);
  const activitySalt = process.env.RATE_LIMIT_SALT;
  const passwordHash = ownerPasswordHash();
  if (!activitySalt || !preferenceConfigured()) return privateResponse(503);

  if (process.env.VERCEL === '1') {
    const requestIp = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim();
    try {
      const redis = getRedis();
      if (!redis || !requestIp) return privateResponse(503);
      const now = Date.now();
      const reservation = await reserveSiteActivityOwnerRateLimit(
        redis,
        siteActivityOwnerRateLimitKey(requestIp, activitySalt, now),
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

  if ('inspect' in body) {
    return privateJson({
      excluded: isSiteActivityBrowserExcluded(request.cookies.get(SITE_ACTIVITY_EXCLUSION_COOKIE_NAME)?.value, activitySalt),
      network: ownerNetworkContext(request.headers, process.env.VERCEL === '1'),
      checkedAt: new Date().toISOString()
    }, 200);
  }

  let auditSaved = false;
  let actionId: string | null = null;
  const checkedAt = new Date();
  // Losing audit storage must never prevent a browser from opting out.
  // Report that limitation explicitly instead of claiming the action was saved.
  try {
    const redis = getRedis();
    if (redis) {
      const audit = await recordOwnerAction(redis, request.headers, process.env.VERCEL === '1', body.excluded, checkedAt);
      auditSaved = audit.saved;
      actionId = audit.saved ? audit.record.id : null;
    }
  } catch { /* The preference still applies; the response discloses the missing receipt. */ }

  const response = NextResponse.json(
    { excluded: body.excluded, network: ownerNetworkContext(request.headers, process.env.VERCEL === '1'),
      checkedAt: checkedAt.toISOString(), auditSaved, actionId },
    { headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' } }
  );
  response.cookies.set(
    SITE_ACTIVITY_EXCLUSION_COOKIE_NAME,
    body.excluded ? siteActivityExclusionCookieValue(activitySalt) : '',
    body.excluded ? cookieOptions() : { ...cookieOptions(), maxAge: 0 }
  );
  return response;
}
