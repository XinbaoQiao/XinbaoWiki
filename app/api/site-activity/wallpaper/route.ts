import { NextRequest, NextResponse } from 'next/server';
import {
  SITE_BACKGROUND_MAX_BYTES,
  isAcceptedSiteBackgroundMime,
  parseSharedSiteBackground,
  sniffImageMimeType,
  type SharedSiteBackground
} from '@/lib/site-wallpaper-shared';
import {
  clearSharedSiteBackground,
  readSharedSiteBackground,
  siteBackgroundBlobConfigured,
  siteBackgroundLocalFallbackEnabled,
  siteBackgroundPasswordRequired,
  siteBackgroundSharedConfigured,
  siteBackgroundWritableConfigured,
  storeSharedSiteBackgroundImage,
  writeSharedSiteBackgroundMeta
} from '@/lib/site-wallpaper-store';
import {
  reserveSiteActivityOwnerRateLimit,
  siteActivityOwnerRateLimitKey,
  verifySiteActivityOwnerPassword
} from '@/lib/site-activity-owner-auth';
import { Redis } from '@upstash/redis';
import { clampOverlay, isCustomBgMode, isCustomBgPosition, type CustomBgTone } from '@/lib/site-custom-background';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function privateJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' }
  });
}

function publicJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'public, max-age=30, s-maxage=30, stale-while-revalidate=60',
      'X-Robots-Tag': 'noindex, nofollow'
    }
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

function isTone(value: unknown): value is CustomBgTone {
  return value === 'light' || value === 'dark';
}

function publicPayload(shared: SharedSiteBackground) {
  return {
    ...shared,
    shared: siteBackgroundSharedConfigured(),
    writable: siteBackgroundWritableConfigured(),
    blob: siteBackgroundBlobConfigured(),
    localFallback: siteBackgroundLocalFallbackEnabled(),
    passwordRequired: siteBackgroundPasswordRequired()
  };
}

let redisClient: Redis | null = null;
function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const redisAuth = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !redisAuth) return null;
  redisClient ??= new Redis({ url, token: redisAuth, retry: false, signal: () => AbortSignal.timeout(2_000) });
  return redisClient;
}

async function enforceOwnerRateLimit(request: NextRequest) {
  const activitySalt = process.env.RATE_LIMIT_SALT;
  if (process.env.VERCEL !== '1' || !activitySalt) return null;
  const requestIp = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim();
  const redis = getRedis();
  if (!redis || !requestIp) return privateJson({ error: 'Unavailable.' }, 503);
  const now = Date.now();
  const reservation = await reserveSiteActivityOwnerRateLimit(
    redis,
    siteActivityOwnerRateLimitKey(requestIp, activitySalt, now),
    now
  );
  if (!reservation.allowed) {
    return new NextResponse(JSON.stringify({ error: 'Too many attempts.' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-store',
        'Retry-After': String(reservation.retryAfterSeconds),
        'X-Robots-Tag': 'noindex, nofollow'
      }
    });
  }
  return null;
}

async function requireOwnerPassword(request: NextRequest, password: string | null) {
  if (!siteBackgroundWritableConfigured()) {
    return privateJson({
      error: 'Shared background writes are not configured. Set Upstash Redis, the owner password hash, and production blob credentials.'
    }, 503);
  }
  if (!password || typeof password !== 'string') return privateJson({ error: 'Password required.' }, 401);
  const passwordLength = Buffer.byteLength(password, 'utf8');
  if (passwordLength < 8 || passwordLength > 256) return privateJson({ error: 'Unauthorized.' }, 401);

  // Local preview without an owner hash: accept any password meeting length rules.
  if (!siteBackgroundPasswordRequired()) {
    if (siteBackgroundLocalFallbackEnabled()) return null;
    return privateJson({ error: 'SITE_ACTIVITY_OWNER_PASSWORD_HASH is required.' }, 503);
  }
  const limited = await enforceOwnerRateLimit(request);
  if (limited) return limited;
  let accepted = false;
  try {
    accepted = await verifySiteActivityOwnerPassword(password, ownerPasswordHash());
  } catch {
    return privateJson({ error: 'Unavailable.' }, 503);
  }
  if (!accepted) return privateJson({ error: 'Unauthorized.' }, 401);
  return null;
}

export async function GET() {
  const shared = await readSharedSiteBackground();
  return publicJson(publicPayload(shared));
}

export async function POST(request: NextRequest) {
  if (!sameOriginRequest(request)) return privateJson({ error: 'Forbidden.' }, 403);

  const contentType = request.headers.get('content-type') || '';
  if (/^multipart\/form-data/i.test(contentType)) {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return privateJson({ error: 'Invalid form.' }, 400);
    }
    const password = typeof form.get('password') === 'string' ? String(form.get('password')) : null;
    const denied = await requireOwnerPassword(request, password);
    if (denied) return denied;

    const file = form.get('image');
    if (!(file instanceof File)) return privateJson({ error: 'Image required.' }, 400);
    if (file.size <= 0 || file.size > SITE_BACKGROUND_MAX_BYTES) {
      return privateJson({ error: 'Image too large.' }, 400);
    }

    const current = await readSharedSiteBackground();
    const bytes = Buffer.from(await file.arrayBuffer());
    const mime = sniffImageMimeType(bytes, file.type, file.name);
    if (!mime || !isAcceptedSiteBackgroundMime(mime)) {
      return privateJson({ error: 'Unsupported image type. Use JPEG, PNG, or WebP.' }, 400);
    }
    const imageUrl = await storeSharedSiteBackgroundImage(bytes, mime);

    const modeRaw = form.get('mode');
    const overlayRaw = form.get('overlay');
    const positionRaw = form.get('position');
    const toneRaw = form.get('tone');
    const enabledRaw = form.get('enabled');

    const next: SharedSiteBackground = parseSharedSiteBackground({
      enabled: enabledRaw == null ? true : String(enabledRaw) !== 'false',
      imageUrl,
      mode: typeof modeRaw === 'string' && isCustomBgMode(modeRaw) ? modeRaw : current.mode,
      overlay: typeof overlayRaw === 'string' ? Number(overlayRaw) : current.overlay,
      position: typeof positionRaw === 'string' && isCustomBgPosition(positionRaw) ? positionRaw : current.position,
      tone: typeof toneRaw === 'string' && isTone(toneRaw) ? toneRaw : current.tone,
      updatedAt: new Date().toISOString()
    });

    if (current.imageUrl && current.imageUrl !== imageUrl) {
      // Best-effort cleanup of the previous object; ignore failures.
      try {
        const { deleteSharedSiteBackgroundImage } = await import('@/lib/site-wallpaper-store');
        await deleteSharedSiteBackgroundImage(current.imageUrl);
      } catch { /* ignore */ }
    }

    const saved = await writeSharedSiteBackgroundMeta(next);
    return privateJson(publicPayload(saved));
  }

  if (!/^application\/json/i.test(contentType)) return privateJson({ error: 'Unsupported media type.' }, 415);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return privateJson({ error: 'Invalid JSON.' }, 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return privateJson({ error: 'Invalid body.' }, 400);
  const raw = body as Record<string, unknown>;
  const password = typeof raw.password === 'string' ? raw.password : null;
  const denied = await requireOwnerPassword(request, password);
  if (denied) return denied;

  if (raw.clear === true) {
    const cleared = await clearSharedSiteBackground();
    return privateJson(publicPayload(cleared));
  }

  const current = await readSharedSiteBackground();
  if (!current.imageUrl && raw.enabled === true) {
    return privateJson({ error: 'Upload an image before enabling the shared background.' }, 400);
  }

  const next = parseSharedSiteBackground({
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : current.enabled,
    imageUrl: current.imageUrl,
    mode: typeof raw.mode === 'string' && isCustomBgMode(raw.mode) ? raw.mode : current.mode,
    overlay: typeof raw.overlay === 'number' ? clampOverlay(raw.overlay) : current.overlay,
    position: typeof raw.position === 'string' && isCustomBgPosition(raw.position) ? raw.position : current.position,
    tone: isTone(raw.tone) ? raw.tone : current.tone,
    updatedAt: new Date().toISOString()
  });

  const saved = await writeSharedSiteBackgroundMeta(next);
  return privateJson(publicPayload(saved));
}

export async function DELETE(request: NextRequest) {
  if (!sameOriginRequest(request)) return privateJson({ error: 'Forbidden.' }, 403);
  let password: string | null = null;
  try {
    const body = await request.json();
    if (body && typeof body === 'object' && typeof (body as { password?: unknown }).password === 'string') {
      password = (body as { password: string }).password;
    }
  } catch {
    password = null;
  }
  const denied = await requireOwnerPassword(request, password);
  if (denied) return denied;
  const cleared = await clearSharedSiteBackground();
  return privateJson(publicPayload(cleared));
}