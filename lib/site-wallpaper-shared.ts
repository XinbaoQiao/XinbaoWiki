import {
  clampOverlay,
  isCustomBgMode,
  isCustomBgPosition,
  type CustomBgMode,
  type CustomBgPosition,
  type CustomBgTone
} from './site-custom-background';

export const SITE_BACKGROUND_REDIS_KEY = ['xinbao', 'site-wallpaper', 'v1'].join(':');
export const SITE_BACKGROUND_BLOB_PATHNAME = ['site-wallpaper', 'wallpaper'].join('/');
export const SITE_BACKGROUND_LOCAL_DIR = 'site-wallpaper';
export const SITE_BACKGROUND_LOCAL_META = ['site-wallpaper', 'meta.json'].join('/');
export const SITE_BACKGROUND_MAX_BYTES = 2.5 * 1024 * 1024;
export const SITE_BACKGROUND_ACCEPT = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export function sniffImageMimeType(bytes: Uint8Array, declaredType?: string | null, fileName?: string | null): string | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return 'image/webp';
  }
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image/gif';
  const declared = (declaredType || '').trim().toLowerCase();
  if (declared === 'image/jpg' || declared === 'image/pjpeg') return 'image/jpeg';
  if (declared === 'image/x-png') return 'image/png';
  if (SITE_BACKGROUND_ACCEPT.has(declared)) return declared;
  const name = (fileName || '').toLowerCase();
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  if (name.endsWith('.gif')) return 'image/gif';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  return null;
}

export function isAcceptedSiteBackgroundMime(mime: string | null | undefined): boolean {
  return Boolean(mime && SITE_BACKGROUND_ACCEPT.has(mime));
}

export type SharedSiteBackground = {
  enabled: boolean;
  imageUrl: string | null;
  mode: CustomBgMode;
  overlay: number;
  position: CustomBgPosition;
  tone: CustomBgTone | null;
  updatedAt: string | null;
};

export type SharedSiteBackgroundPublic = SharedSiteBackground & {
  /** True when this deployment can accept shared background writes. */
  writable: boolean;
  /** True when shared backgrounds are supported (Redis and/or local fallback). */
  shared: boolean;
  /** True when images go to Vercel Blob (otherwise local public/ fallback may apply). */
  blob?: boolean;
  /** True when running off Vercel with public/site-wallpaper fallback. */
  localFallback?: boolean;
  /** True when SITE_ACTIVITY_OWNER_PASSWORD_HASH is configured and required for writes. */
  passwordRequired?: boolean;
};

export const EMPTY_SHARED_SITE_BACKGROUND: SharedSiteBackground = {
  enabled: false,
  imageUrl: null,
  mode: 'cover',
  overlay: 50,
  position: 'center',
  tone: null,
  updatedAt: null
};

function isTone(value: unknown): value is CustomBgTone {
  return value === 'light' || value === 'dark';
}

export function parseSharedSiteBackground(value: unknown): SharedSiteBackground {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...EMPTY_SHARED_SITE_BACKGROUND };
  }
  const raw = value as Partial<SharedSiteBackground>;
  const imageUrl = typeof raw.imageUrl === 'string' && raw.imageUrl.trim() ? raw.imageUrl.trim() : null;
  const enabled = Boolean(raw.enabled) && Boolean(imageUrl);
  return {
    enabled,
    imageUrl: enabled ? imageUrl : null,
    mode: isCustomBgMode(raw.mode) ? raw.mode : 'cover',
    overlay: clampOverlay(typeof raw.overlay === 'number' ? raw.overlay : 50),
    position: isCustomBgPosition(raw.position) ? raw.position : 'center',
    tone: isTone(raw.tone) ? raw.tone : null,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null
  };
}

export function sharedBackgroundToSettings(shared: SharedSiteBackground) {
  return {
    enabled: shared.enabled,
    mode: shared.mode,
    overlay: shared.overlay,
    position: shared.position
  };
}

/** Serialize safe CSS url() for an https or same-origin path. Rejects quotes / escapes. */
export function cssUrlForSharedImage(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  if (!/^(https:\/\/|\/)[^\s"'<>\\]+$/i.test(imageUrl)) return null;
  return imageUrl;
}

export function sharedBackgroundInlineStyle(shared: SharedSiteBackground): string {
  const url = cssUrlForSharedImage(shared.imageUrl);
  if (!shared.enabled || !url) return '';
  const overlay = clampOverlay(shared.overlay) / 100;
  const scrim = shared.tone === 'dark' ? '8 10 12' : '255 255 255';
  const position = shared.position === 'top' || shared.position === 'bottom' ? shared.position : 'center';
  return [
    `--site-custom-bg-image:url("${url}")`,
    `--site-custom-bg-overlay:${overlay}`,
    `--site-custom-bg-position:${position}`,
    `--site-custom-bg-scrim-rgb:${scrim}`,
    `--site-custom-bg-panel:0`
  ].join(';');
}

export function sharedBackgroundHtmlDataset(shared: SharedSiteBackground): Record<string, string> {
  if (!shared.enabled || !shared.imageUrl) {
    return { 'data-site-custom-bg': 'off' };
  }
  const dataset: Record<string, string> = {
    'data-site-custom-bg': 'on',
    'data-site-custom-bg-mode': shared.mode,
    'data-site-custom-bg-position': shared.position,
    'data-site-custom-bg-overlay': String(clampOverlay(shared.overlay))
  };
  if (shared.tone) dataset['data-site-custom-bg-tone'] = shared.tone;
  dataset['data-site-custom-bg-ink'] = shared.tone === 'dark' ? 'light' : 'dark';
  return dataset;
}