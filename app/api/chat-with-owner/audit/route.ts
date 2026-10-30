import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import { authorizedChatAudit, chatAuditDate, readChatAudit, validChatAuditDate } from '@/lib/chat-audit';

export const runtime = 'nodejs';

function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: {
    'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow',
    'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff',
  } });
}

export async function GET(request: NextRequest) {
  // Authenticate before query validation, configuration checks or any store access.
  if (!authorizedChatAudit(request.headers)) return privateJson({ error: 'Unauthorized.' }, 401);
  const params = new URL(request.url).searchParams;
  const allowed = ['date', 'kind', 'limit', 'offset', 'snapshot'];
  if ([...params.keys()].some(key => !allowed.includes(key) || params.getAll(key).length !== 1)) return privateJson({ error: 'Invalid audit query.' }, 400);
  const date = params.get('date') ?? chatAuditDate();
  const kind = params.get('kind') ?? 'accepted';
  const integer = (name: string, fallback: number) => params.has(name) && !/^\d+$/.test(params.get(name) || '') ? NaN : Number(params.get(name) ?? fallback);
  const limit = integer('limit', 100);
  const offset = integer('offset', 0);
  const snapshot = params.has('snapshot') ? integer('snapshot', 0) : undefined;
  const cap = kind === 'rejected' ? 500 : 2_000;
  if (!validChatAuditDate(date) || !['accepted', 'rejected'].includes(kind) || !Number.isInteger(limit) || limit < 1 || limit > 200 || !Number.isInteger(offset) || offset < 0 || offset > cap || (snapshot !== undefined && (!Number.isInteger(snapshot) || snapshot < offset || snapshot > cap))) return privateJson({ error: 'Invalid audit query.' }, 400);
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const redisAuth = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !redisAuth) return privateJson({ error: 'Chat audit is unavailable.' }, 503);
  try {
    const store = new Redis({ url, token: redisAuth });
    return privateJson(await readChatAudit(store, date, kind as 'accepted' | 'rejected', limit, offset, snapshot));
  } catch { return privateJson({ error: 'Chat audit or snapshot is unavailable.' }, 503); }
}
