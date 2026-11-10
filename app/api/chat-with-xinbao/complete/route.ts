import { NextRequest, NextResponse } from 'next/server';
import { CHAT_PREDICT_COOKIE_NAME, executeChatComposerComplete } from '@/lib/chat-composer-predict-server';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';

let redisClient: Redis | null | undefined;

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const redisAuth = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !redisAuth) return null;
  redisClient ??= new Redis({ url, token: redisAuth });
  return redisClient;
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  cookie?: { visitorId: string; shouldSet: boolean },
  retryAfterSeconds?: number
) {
  const response = NextResponse.json(body, { status });
  response.headers.set('Cache-Control', 'private, no-store');
  if (status === 429 && retryAfterSeconds) {
    response.headers.set('Retry-After', String(Math.max(1, Math.ceil(retryAfterSeconds))));
  }
  if (cookie?.shouldSet) {
    response.cookies.set(CHAT_PREDICT_COOKIE_NAME, cookie.visitorId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365
    });
  }
  return response;
}

export async function POST(request: NextRequest) {
  const result = await executeChatComposerComplete(request, { getRedis });
  return jsonResponse(
    result.body,
    result.status,
    result.visitorId ? { visitorId: result.visitorId, shouldSet: Boolean(result.shouldSetCookie) } : undefined,
    result.retryAfterSeconds
  );
}

export function GET() {
  return jsonResponse({ error: 'method-not-allowed' }, 405);
}
