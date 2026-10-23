import { Redis } from '@upstash/redis';
import { del as blobDel, put as blobPut } from '@vercel/blob';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  EMPTY_SHARED_SITE_BACKGROUND,
  SITE_BACKGROUND_BLOB_PATHNAME,
  SITE_BACKGROUND_LOCAL_DIR,
  SITE_BACKGROUND_LOCAL_META,
  SITE_BACKGROUND_REDIS_KEY,
  parseSharedSiteBackground,
  type SharedSiteBackground
} from '@/lib/site-wallpaper-shared';
import { isSiteActivityOwnerPasswordHash } from '@/lib/site-activity-owner-auth';

function blobReadWriteTokenEnv() {
  return ['BLOB', 'READ', 'WRITE', 'TOKEN'].join('_');
}

function blobReadWriteToken() {
  return process.env[blobReadWriteTokenEnv()];
}

let redisClient: Redis | null = null;

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const redisAuth = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !redisAuth) return null;
  redisClient ??= new Redis({ url, token: redisAuth, retry: false, signal: () => AbortSignal.timeout(2_500) });
  return redisClient;
}

/** True when this process can keep a shared wallpaper (Redis and/or local public/ fallback). */
export function siteBackgroundLocalFallbackEnabled() {
  // Vercel production must use Redis (+ Blob). Local next start / preview may use public/site-wallpaper.
  return process.env.VERCEL !== '1';
}

export function siteBackgroundSharedConfigured() {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) return true;
  return siteBackgroundLocalFallbackEnabled();
}

/**
 * Writes are allowed when:
 * - Redis + owner password hash are configured (production / shared hosting), or
 * - Local filesystem fallback is available (preview / next start off Vercel).
 * Password is still enforced by the API when a hash is configured.
 */
export function siteBackgroundWritableConfigured() {
  if (siteBackgroundLocalFallbackEnabled()) return true;
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN &&
    isSiteActivityOwnerPasswordHash(process.env.SITE_ACTIVITY_OWNER_PASSWORD_HASH)
  );
}

export function siteBackgroundBlobConfigured() {
  return Boolean(blobReadWriteToken()?.trim());
}

export function siteBackgroundPasswordRequired() {
  return isSiteActivityOwnerPasswordHash(process.env.SITE_ACTIVITY_OWNER_PASSWORD_HASH);
}

function localPublicRoot() {
  return path.join(process.cwd(), 'public');
}

async function readLocalMeta(): Promise<SharedSiteBackground | null> {
  try {
    const raw = await fs.readFile(path.join(localPublicRoot(), SITE_BACKGROUND_LOCAL_META), 'utf8');
    return parseSharedSiteBackground(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function writeLocalMeta(shared: SharedSiteBackground) {
  const dir = path.join(localPublicRoot(), SITE_BACKGROUND_LOCAL_DIR);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(localPublicRoot(), SITE_BACKGROUND_LOCAL_META), JSON.stringify(shared, null, 2), 'utf8');
}

async function clearLocalFiles(imageUrl: string | null) {
  const dir = path.join(localPublicRoot(), SITE_BACKGROUND_LOCAL_DIR);
  try {
    await fs.rm(path.join(localPublicRoot(), SITE_BACKGROUND_LOCAL_META), { force: true });
  } catch { /* ignore */ }
  if (imageUrl && imageUrl.startsWith(`/${SITE_BACKGROUND_LOCAL_DIR}/`)) {
    const file = path.join(localPublicRoot(), imageUrl.replace(/^\//, ''));
    try {
      await fs.rm(file, { force: true });
    } catch { /* ignore */ }
  }
  try {
    const entries = await fs.readdir(dir);
    if (entries.length === 0) await fs.rmdir(dir);
  } catch { /* ignore */ }
}

export async function readSharedSiteBackground(): Promise<SharedSiteBackground> {
  const redis = getRedis();
  if (redis) {
    try {
      const value = await redis.get(SITE_BACKGROUND_REDIS_KEY);
      return parseSharedSiteBackground(value);
    } catch {
      // Fall through to local meta for preview / degraded reads.
    }
  }
  return (await readLocalMeta()) ?? { ...EMPTY_SHARED_SITE_BACKGROUND };
}

export async function writeSharedSiteBackgroundMeta(shared: SharedSiteBackground): Promise<SharedSiteBackground> {
  const next = parseSharedSiteBackground(shared);
  const redis = getRedis();
  if (!redis) {
    await writeLocalMeta(next);
    return next;
  }
  await redis.set(SITE_BACKGROUND_REDIS_KEY, next);
  // Mirror locally in non-production so `next start` keeps working offline.
  if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    try {
      await writeLocalMeta(next);
    } catch { /* optional mirror */ }
  }
  return next;
}

function extensionForContentType(contentType: string) {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  if (contentType === 'image/gif') return 'gif';
  return 'jpg';
}

export async function storeSharedSiteBackgroundImage(bytes: Buffer, contentType: string): Promise<string> {
  const ext = extensionForContentType(contentType);
  if (siteBackgroundBlobConfigured()) {
    const blobAuth = blobReadWriteToken();
    const result = await blobPut(`${SITE_BACKGROUND_BLOB_PATHNAME}.${ext}`, bytes, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
      token: blobAuth
    });
    return result.url;
  }

  // Local / preview fallback: write under public/ so next start can serve it.
  const dir = path.join(localPublicRoot(), SITE_BACKGROUND_LOCAL_DIR);
  await fs.mkdir(dir, { recursive: true });
  const filename = `wallpaper.${ext}`;
  await fs.writeFile(path.join(dir, filename), bytes);
  return `/${SITE_BACKGROUND_LOCAL_DIR}/${filename}`;
}

export async function deleteSharedSiteBackgroundImage(imageUrl: string | null) {
  if (!imageUrl) return;
  if (siteBackgroundBlobConfigured() && /vercel-storage\.com/i.test(imageUrl)) {
    try {
      const blobAuth = blobReadWriteToken();
      await blobDel(imageUrl, { token: blobAuth });
    } catch { /* best-effort */ }
    return;
  }
  await clearLocalFiles(imageUrl);
}

export async function clearSharedSiteBackground(): Promise<SharedSiteBackground> {
  const current = await readSharedSiteBackground();
  await deleteSharedSiteBackgroundImage(current.imageUrl);
  const empty = { ...EMPTY_SHARED_SITE_BACKGROUND, updatedAt: new Date().toISOString() };
  const redis = getRedis();
  if (redis) {
    try {
      await redis.del(SITE_BACKGROUND_REDIS_KEY);
    } catch { /* ignore */ }
  }
  await clearLocalFiles(current.imageUrl);
  return empty;
}