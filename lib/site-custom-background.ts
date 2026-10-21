export type CustomBgMode = 'cover' | 'soft-fade' | 'tile' | 'depth';
export type CustomBgPosition = 'top' | 'center' | 'bottom';

export type CustomBgSettings = {
  enabled: boolean;
  mode: CustomBgMode;
  /** Light scrim strength from 0 to 100. */
  overlay: number;
  position: CustomBgPosition;
};

export const CUSTOM_BG_SETTINGS_KEY = 'xinbaopedia-custom-bg-settings';
export const CUSTOM_BG_DB_NAME = 'xinbaopedia-custom-bg';
export const CUSTOM_BG_STORE = 'images';
export const CUSTOM_BG_IMAGE_KEY = 'wallpaper';

export const DEFAULT_CUSTOM_BG_SETTINGS: CustomBgSettings = {
  enabled: false,
  mode: 'cover',
  overlay: 48,
  position: 'center'
};

const CUSTOM_BG_MODES: readonly CustomBgMode[] = ['cover', 'soft-fade', 'tile', 'depth'];
const CUSTOM_BG_POSITIONS: readonly CustomBgPosition[] = ['top', 'center', 'bottom'];

const MAX_EDGE = 1920;
const MAX_BYTES = 2.5 * 1024 * 1024;
const ACCEPT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export function clampOverlay(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_CUSTOM_BG_SETTINGS.overlay;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function isCustomBgMode(value: unknown): value is CustomBgMode {
  return typeof value === 'string' && (CUSTOM_BG_MODES as readonly string[]).includes(value);
}

export function isCustomBgPosition(value: unknown): value is CustomBgPosition {
  return typeof value === 'string' && (CUSTOM_BG_POSITIONS as readonly string[]).includes(value);
}

export function parseCustomBgSettings(raw: string | null): CustomBgSettings {
  if (!raw) return { ...DEFAULT_CUSTOM_BG_SETTINGS };

  try {
    const parsed = JSON.parse(raw) as Partial<CustomBgSettings>;
    return {
      enabled: Boolean(parsed.enabled),
      mode: isCustomBgMode(parsed.mode) ? parsed.mode : DEFAULT_CUSTOM_BG_SETTINGS.mode,
      overlay: clampOverlay(typeof parsed.overlay === 'number' ? parsed.overlay : DEFAULT_CUSTOM_BG_SETTINGS.overlay),
      position: isCustomBgPosition(parsed.position) ? parsed.position : DEFAULT_CUSTOM_BG_SETTINGS.position
    };
  } catch {
    return { ...DEFAULT_CUSTOM_BG_SETTINGS };
  }
}

export function readCustomBgSettings(): CustomBgSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_CUSTOM_BG_SETTINGS };
  return parseCustomBgSettings(window.localStorage.getItem(CUSTOM_BG_SETTINGS_KEY));
}

export function writeCustomBgSettings(settings: CustomBgSettings): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CUSTOM_BG_SETTINGS_KEY, JSON.stringify({
    enabled: settings.enabled,
    mode: settings.mode,
    overlay: clampOverlay(settings.overlay),
    position: settings.position
  }));
}

export function clearCustomBgSettings(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(CUSTOM_BG_SETTINGS_KEY);
}

function openCustomBgDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(CUSTOM_BG_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CUSTOM_BG_STORE)) {
        db.createObjectStore(CUSTOM_BG_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open custom background database'));
  });
}

export async function loadCustomBgBlob(): Promise<Blob | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return null;
  const db = await openCustomBgDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(CUSTOM_BG_STORE, 'readonly');
      const store = tx.objectStore(CUSTOM_BG_STORE);
      const request = store.get(CUSTOM_BG_IMAGE_KEY);
      request.onsuccess = () => {
        const value = request.result;
        resolve(value instanceof Blob ? value : null);
      };
      request.onerror = () => reject(request.error ?? new Error('Failed to read custom background'));
    });
  } finally {
    db.close();
  }
}

export async function saveCustomBgBlob(blob: Blob): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    throw new Error('IndexedDB is unavailable');
  }
  const db = await openCustomBgDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(CUSTOM_BG_STORE, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to save custom background'));
      tx.objectStore(CUSTOM_BG_STORE).put(blob, CUSTOM_BG_IMAGE_KEY);
    });
  } finally {
    db.close();
  }
}

export async function deleteCustomBgBlob(): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) return;
  const db = await openCustomBgDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(CUSTOM_BG_STORE, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to clear custom background'));
      tx.objectStore(CUSTOM_BG_STORE).delete(CUSTOM_BG_IMAGE_KEY);
    });
  } finally {
    db.close();
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to encode image'));
        return;
      }
      resolve(blob);
    }, type, quality);
  });
}

export async function compressImageFile(file: File): Promise<Blob> {
  if (!ACCEPT_TYPES.has(file.type) && !file.type.startsWith('image/')) {
    throw new Error('Unsupported image type');
  }

  let bitmap: ImageBitmap;
  {
    const probe = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(probe.width, probe.height));
    const targetW = Math.max(1, Math.round(probe.width * scale));
    const targetH = Math.max(1, Math.round(probe.height * scale));
    const alreadySmall = probe.width === targetW && probe.height === targetH;
    if (alreadySmall) {
      bitmap = probe;
    } else {
      probe.close();
      try {
        bitmap = await createImageBitmap(file, {
          resizeWidth: targetW,
          resizeHeight: targetH,
          resizeQuality: 'high'
        });
      } catch {
        bitmap = await createImageBitmap(file);
      }
    }
  }
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('Canvas unavailable');
    context.drawImage(bitmap, 0, 0, width, height);

    const preferPng = file.type === 'image/png' || file.type === 'image/gif';
    if (preferPng) {
      const png = await canvasToBlob(canvas, 'image/png');
      if (png.size <= MAX_BYTES) return png;
    }

    let quality = 0.86;
    let best: Blob | null = null;
    while (quality >= 0.52) {
      const jpeg = await canvasToBlob(canvas, 'image/jpeg', quality);
      best = jpeg;
      if (jpeg.size <= MAX_BYTES) return jpeg;
      quality -= 0.08;
    }

    if (best && best.size <= MAX_BYTES * 1.15) return best;
    throw new Error('Image is still too large after compression');
  } finally {
    bitmap.close();
  }
}

export function panelAlphaForOverlay(overlayPercent: number): number {
  const overlay = clampOverlay(overlayPercent) / 100;
  if (overlay <= 0) return 0;
  // Map low overlay to a light reading wash; 0% keeps wallpaper fully clear.
  return Math.min(0.92, 0.22 + overlay * 0.7);
}

export type CustomBgTone = 'light' | 'dark';
export type CustomBgInk = 'dark' | 'light';

/** Overlay at/above this keeps default dark text even on dark wallpapers. */
export const CUSTOM_BG_INK_OVERLAY_THRESHOLD = 42;

export function toneFromLuminance(luminance: number): CustomBgTone {
  if (!Number.isFinite(luminance)) return 'light';
  return luminance < 0.45 ? 'dark' : 'light';
}

export function inkForCustomBg(active: boolean, tone: CustomBgTone | null, overlayPercent: number): CustomBgInk | 'none' {
  if (!active || !tone) return 'none';
  if (tone === 'light') return 'dark';
  return clampOverlay(overlayPercent) >= CUSTOM_BG_INK_OVERLAY_THRESHOLD ? 'dark' : 'light';
}

/** Average relative luminance of an image blob via a tiny canvas downsample. */
export async function estimateImageLuminance(blob: Blob): Promise<number> {
  if (typeof createImageBitmap !== 'function') return 0.6;
  const bitmap = await createImageBitmap(blob);
  try {
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return 0.6;
    context.drawImage(bitmap, 0, 0, size, size);
    const { data } = context.getImageData(0, 0, size, size);
    let total = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3] / 255;
      if (alpha < 0.08) continue;
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      // Rec. 709 relative luminance
      total += 0.2126 * r + 0.7152 * g + 0.0722 * b;
      count += 1;
    }
    return count ? total / count : 0.6;
  } finally {
    bitmap.close();
  }
}

export function applyCustomBgDocumentState(
  settings: CustomBgSettings,
  hasImage: boolean,
  tone: CustomBgTone | null = null
): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const active = Boolean(settings.enabled && hasImage);
  const overlayPct = clampOverlay(settings.overlay);
  const overlay = overlayPct / 100;
  const panel = active ? panelAlphaForOverlay(overlayPct) : 0;
  const ink = inkForCustomBg(active, tone, overlayPct);
  root.dataset.siteCustomBg = active ? 'on' : 'off';
  root.dataset.siteCustomBgMode = active ? settings.mode : 'none';
  root.dataset.siteCustomBgPosition = active ? settings.position : 'center';
  root.dataset.siteCustomBgOverlay = active ? String(overlayPct) : '0';
  if (active && tone) {
    root.dataset.siteCustomBgTone = tone;
  } else {
    delete root.dataset.siteCustomBgTone;
  }
  if (ink === 'none') {
    delete root.dataset.siteCustomBgInk;
  } else {
    root.dataset.siteCustomBgInk = ink;
  }
  root.style.setProperty('--site-custom-bg-overlay', String(overlay));
  root.style.setProperty('--site-custom-bg-panel', String(panel));
  root.style.setProperty('--site-custom-bg-position', settings.position);
}

export function revokeObjectUrl(url: string | null | undefined): void {
  if (!url || typeof url !== 'string' || !url.startsWith('blob:')) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    // ignore
  }
}
