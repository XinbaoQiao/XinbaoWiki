import { NextRequest, NextResponse } from 'next/server';
import {
  isSiteActivityBrowserExcluded,
  SITE_ACTIVITY_EXCLUSION_COOKIE_NAME,
  SITE_ACTIVITY_PREFERENCE_COOKIE_MAX_AGE_SECONDS,
  siteActivityExclusionCookieValue
} from '@/lib/site-activity-preference';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function privateJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' }
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

async function acceptsEmptyBody(request: NextRequest) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (!Number.isFinite(contentLength) || contentLength < 0 || contentLength > 0) return false;
  try {
    return (await request.arrayBuffer()).byteLength === 0;
  } catch {
    return false;
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

function preferenceConfigured() {
  return Boolean(
    process.env.RATE_LIMIT_SALT &&
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
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
  if (!(await acceptsEmptyBody(request))) return privateResponse(400);
  const secret = process.env.RATE_LIMIT_SALT;
  if (!secret || !preferenceConfigured()) return privateResponse(503);

  const response = privateResponse(204);
  response.cookies.set(
    SITE_ACTIVITY_EXCLUSION_COOKIE_NAME,
    siteActivityExclusionCookieValue(secret),
    cookieOptions()
  );
  return response;
}

export async function DELETE(request: NextRequest) {
  if (!sameOriginRequest(request)) return privateResponse(403);
  if (!(await acceptsEmptyBody(request))) return privateResponse(400);

  const response = privateResponse(204);
  const expiredOptions = { ...cookieOptions(), maxAge: 0 };
  response.cookies.set(SITE_ACTIVITY_EXCLUSION_COOKIE_NAME, '', expiredOptions);
  return response;
}
