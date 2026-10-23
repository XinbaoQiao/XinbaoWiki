'use client';



import { WikiLink } from '@/components/WikiLink';

import { clearWikiMorphIntent } from '@/lib/wiki-view-transition';

import {

  applyCustomBgDocumentState,

  clearCustomBgSettings,

  compressImageFile,
  imageExtensionForMime,
  normalizeImageMimeType,

  DEFAULT_CUSTOM_BG_SETTINGS,

  deleteCustomBgBlob,

  estimateImageLuminance,

  loadCustomBgBlob,

  readCustomBgSettings,

  revokeObjectUrl,

  saveCustomBgBlob,

  toneFromLuminance,

  writeCustomBgSettings,

  type CustomBgMode,

  type CustomBgPosition,

  type CustomBgSettings,

  type CustomBgTone

} from '@/lib/site-custom-background';
import {
  cssUrlForSharedImage,
  sharedBackgroundToSettings,
  type SharedSiteBackgroundPublic
} from '@/lib/site-wallpaper-shared';

const SITE_WALLPAPER_API = '/api/site-activity/wallpaper/';
const WALLPAPER_UPLOAD_TIMEOUT_MS = 45_000;


import type { CSSProperties, ChangeEvent } from 'react';

import { useEffect, useId, useRef, useState, useLayoutEffect } from 'react';

import { usePathname } from 'next/navigation';



function withBasePath(pathname: string) {

  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');

  return basePath ? `${basePath}${pathname}` : pathname;

}



function activeSlug(pathname: string) {

  const decoded = decodeURIComponent(pathname);

  const parts = decoded.replace(/\/+$/, '').split('/').filter(Boolean);

  const wikiIndex = parts.lastIndexOf('wiki');

  return wikiIndex >= 0 && parts[wikiIndex + 1] ? parts[wikiIndex + 1] : 'Your_Name';

}



function isChineseSlug(slug: string) {

  return slug === 'Your_Name_zh' || slug.endsWith('_zh');

}



function chineseSlug(slug: string) {

  if (slug === 'Your_Name') return 'Your_Name_zh';

  if (isChineseSlug(slug)) return slug;

  return `${slug}_zh`;

}



function englishSlug(slug: string) {

  if (slug === 'Your_Name_zh') return 'Your_Name';

  return slug.endsWith('_zh') ? slug.slice(0, -3) : slug;

}



export function LanguageToggle() {

  const pathname = usePathname() || '';

  const isWikiPage = decodeURIComponent(pathname).split('/').includes('wiki');

  const slug = activeSlug(pathname);

  const isChinesePage = isChineseSlug(slug);



  useEffect(() => {

    document.documentElement.lang = isWikiPage && isChinesePage ? 'zh-CN' : 'en';

  }, [isChinesePage, isWikiPage]);



  if (!isWikiPage) return null;



  const targetSlug = isChinesePage ? englishSlug(slug) : chineseSlug(slug);

  const href = `/wiki/${encodeURIComponent(targetSlug)}/`;

  const accessibleLabel = isChinesePage ? 'Switch to English' : '切换至中文';



  return (

    <WikiLink

      aria-label={accessibleLabel}

      className="lang-toggle"

      href={withBasePath(href)}

      title={accessibleLabel}

      onClick={() => clearWikiMorphIntent()}

    >

      {isChinesePage ? 'English' : '中文'}

    </WikiLink>

  );

}



type SitePaletteName = 'text' | 'blue' | 'gold' | 'rose' | 'green' | 'violet' | 'charcoal';

type SitePaletteMode = SitePaletteName | 'auto';



type SitePaletteOption = {

  color: string;

  mode: SitePaletteMode;

  title: string;

};



type SitePaletteProps = {
  icons: Record<SitePaletteName, string>;
  initialSharedBackground?: SharedSiteBackgroundPublic | null;
};



const sitePaletteStorageKey = 'mywiki-palette-mode';



const sitePaletteOptions: SitePaletteOption[] = [

  { color: '#ffffff', mode: 'text', title: 'Pure white text theme' },

  { color: '#2b5f94', mode: 'blue', title: 'Morning blue theme' },

  { color: '#b8871b', mode: 'gold', title: 'Midday gold theme' },

  { color: '#a44962', mode: 'rose', title: 'Scholar rose theme' },

  { color: '#2a7f62', mode: 'green', title: 'Evening green theme' },

  { color: '#70518f', mode: 'violet', title: 'Archive violet theme' },

  { color: '#2f3437', mode: 'charcoal', title: 'Night charcoal theme' },

  { color: '#36c', mode: 'auto', title: 'Auto theme by local time' }

];



function isSitePaletteMode(value: string | null): value is SitePaletteMode {

  return value === 'auto' || value === 'text' || value === 'blue' || value === 'gold' || value === 'rose' || value === 'green' || value === 'violet' || value === 'charcoal';

}



function sitePaletteForLocalTime(date = new Date()): Exclude<SitePaletteName, 'text'> {

  const hour = date.getHours();



  if (hour >= 5 && hour < 9) return 'blue';

  if (hour >= 9 && hour < 13) return 'gold';

  if (hour >= 13 && hour < 16) return 'rose';

  if (hour >= 16 && hour < 19) return 'green';

  if (hour >= 19 && hour < 22) return 'violet';

  return 'charcoal';

}



function updateSiteFavicon(href: string) {

  const selector = 'link[data-site-favicon="true"]';

  let link = document.querySelector<HTMLLinkElement>(selector);



  if (!link) {

    link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');

  }



  if (!link) {

    link = document.createElement('link');

    document.head.appendChild(link);

  }



  link.dataset.siteFavicon = 'true';

  link.rel = 'icon';

  link.type = 'image/png';

  link.sizes = '512x512';

  link.href = href;

}



function prefersCoarsePalettePointer() {

  return typeof window !== 'undefined'

    && window.matchMedia('(hover: none), (pointer: coarse)').matches;

}



function readChromeChinese(pathname: string): boolean {

  const decoded = decodeURIComponent(pathname || '');

  if (decoded.split('/').includes('wiki')) {

    return isChineseSlug(activeSlug(pathname));

  }

  // Homepage / non-wiki chrome follows documentElement.lang, which

  // HomepagePortal and LanguageToggle keep in sync with the EN/中文 control.

  const lang = typeof document !== 'undefined' ? document.documentElement.lang : '';

  return lang === 'zh-CN' || lang.toLowerCase().startsWith('zh');

}



function useChromeChinese(): boolean {

  const pathname = usePathname() || '';

  const [isChinese, setIsChinese] = useState(false);



  useEffect(() => {

    const sync = () => setIsChinese(readChromeChinese(pathname));

    sync();



    const root = document.documentElement;

    const observer = new MutationObserver(sync);

    observer.observe(root, { attributes: true, attributeFilter: ['lang'] });

    return () => observer.disconnect();

  }, [pathname]);



  return isChinese;

}



const customBgModeOptions: Array<{ mode: CustomBgMode; en: string; zh: string }> = [

  { mode: 'cover', en: 'Cover', zh: '铺满' },

  { mode: 'soft-fade', en: 'Soft fade', zh: '淡出' },

  { mode: 'tile', en: 'Tile', zh: '平铺' },

  { mode: 'depth', en: 'Depth', zh: '景深' }

];



const customBgPositionOptions: Array<{ position: CustomBgPosition; en: string; zh: string }> = [

  { position: 'top', en: 'Top', zh: '顶部' },

  { position: 'center', en: 'Center', zh: '居中' },

  { position: 'bottom', en: 'Bottom', zh: '底部' }

];



export function SitePalette({ icons, initialSharedBackground = null }: SitePaletteProps) {
  const initialSharedSettings = initialSharedBackground?.enabled
    ? sharedBackgroundToSettings(initialSharedBackground)
    : DEFAULT_CUSTOM_BG_SETTINGS;
  const initialSharedUrl = initialSharedBackground?.enabled
    ? cssUrlForSharedImage(initialSharedBackground.imageUrl)
    : null;
  const [mode, setMode] = useState<SitePaletteMode>('auto');
  const [expanded, setExpanded] = useState(false);
  const [customSettings, setCustomSettings] = useState<CustomBgSettings>(initialSharedSettings);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(initialSharedUrl);
  const [customTone, setCustomTone] = useState<CustomBgTone | null>(initialSharedBackground?.tone ?? null);
  const [ownerPassword, setOwnerPassword] = useState('');
  const [publishShared, setPublishShared] = useState(Boolean(initialSharedBackground?.writable));
  const [sharedMeta, setSharedMeta] = useState<SharedSiteBackgroundPublic | null>(initialSharedBackground);
  const [scopeNote, setScopeNote] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDesktopPointer, setIsDesktopPointer] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUrlRef = useRef<string | null>(null);
  const panelId = useId();
  const isChinese = useChromeChinese();

  const applySharedToUi = (shared: SharedSiteBackgroundPublic) => {
    const safeUrl = cssUrlForSharedImage(shared.imageUrl);
    if (!(shared.enabled && safeUrl)) {
      setCustomImageUrl(null);
      setCustomTone(null);
      applyCustomBgDocumentState({ ...DEFAULT_CUSTOM_BG_SETTINGS, enabled: false }, false, null);
      return;
    }
    revokeObjectUrl(imageUrlRef.current);
    imageUrlRef.current = null;
    setCustomImageUrl(safeUrl);
    setCustomTone(shared.tone);
    const settings = sharedBackgroundToSettings(shared);
    setCustomSettings(settings);
    applyCustomBgDocumentState(settings, true, shared.tone);
  };

  const refreshSharedBackground = async () => {
    try {
      const response = await fetch(SITE_WALLPAPER_API, { method: 'GET', credentials: 'same-origin' });
      if (!response.ok) return null;
      const payload = (await response.json()) as SharedSiteBackgroundPublic;
      setSharedMeta(payload);
      if (payload.writable) setPublishShared(true);
      return payload;
    } catch {
      return null;
    }
  };


  useEffect(() => {
    const savedMode = window.localStorage.getItem(sitePaletteStorageKey);
    if (isSitePaletteMode(savedMode)) setMode(savedMode);
    const savedCustom = readCustomBgSettings();
    setCustomSettings(savedCustom);
    if (initialSharedBackground) {
      setSharedMeta(initialSharedBackground);
      setPublishShared(Boolean(initialSharedBackground.writable));
      // Paint SSR wallpaper immediately; do not wait on network or IndexedDB.
      if (initialSharedBackground.enabled && initialSharedBackground.imageUrl) {
        applySharedToUi(initialSharedBackground);
        setScopeNote(isChinese ? '全站背景。' : 'Site-wide background.');
      }
    }
    let cancelled = false;
    const finishLocalAndShared = async () => {
      let localUrl: string | null = null;
      let localTone: CustomBgTone | null = null;
      let localEnabled = false;
      try {
        const blob = await loadCustomBgBlob();
        if (blob) {
          localUrl = URL.createObjectURL(blob);
          localTone = toneFromLuminance(await estimateImageLuminance(blob));
          localEnabled = Boolean(savedCustom.enabled);
        }
      } catch {
        localUrl = null;
      }
      if (cancelled) { revokeObjectUrl(localUrl); return; }
      // Prefer already-known SSR shared; refresh in the background for writable/meta only.
      const shared = initialSharedBackground ?? (await refreshSharedBackground());
      if (!initialSharedBackground) {
        /* already refreshed */
      } else {
        void refreshSharedBackground().then((payload) => {
          if (cancelled || !payload) return;
          if (!(localEnabled && imageUrlRef.current?.startsWith('blob:'))) {
            if (payload.enabled && payload.imageUrl) applySharedToUi(payload);
          }
        });
      }
      if (cancelled) { revokeObjectUrl(localUrl); return; }
      if (localEnabled && localUrl) {
        revokeObjectUrl(imageUrlRef.current);
        imageUrlRef.current = localUrl;
        setCustomImageUrl(localUrl);
        setCustomTone(localTone);
        setCustomSettings(savedCustom);
        applyCustomBgDocumentState(savedCustom, true, localTone);
        setScopeNote(isChinese ? '仅此设备（本机覆盖）。' : 'This device only (local override).');
        return;
      }
      if (shared?.enabled && shared.imageUrl) {
        revokeObjectUrl(localUrl);
        applySharedToUi(shared);
        setScopeNote(isChinese ? '全站背景。' : 'Site-wide background.');
        return;
      }
      if (localUrl) {
        revokeObjectUrl(imageUrlRef.current);
        imageUrlRef.current = localUrl;
        setCustomImageUrl(localUrl);
        setCustomTone(localTone);
        applyCustomBgDocumentState({ ...savedCustom, enabled: false }, false, localTone);
        return;
      }
      if (!initialSharedBackground?.enabled) {
        setCustomTone(null);
        applyCustomBgDocumentState({ ...savedCustom, enabled: false }, false, null);
      }
    };
    // Defer IDB + luminance off the first paint when SSR already supplied the wallpaper.
    if (initialSharedBackground?.enabled && initialSharedBackground.imageUrl && typeof requestIdleCallback === 'function') {
      const idleId = requestIdleCallback(() => { void finishLocalAndShared(); }, { timeout: 1800 });
      return () => {
        cancelled = true;
        cancelIdleCallback(idleId);
        revokeObjectUrl(imageUrlRef.current);
        imageUrlRef.current = null;
      };
    }
    void finishLocalAndShared();
    return () => {
      cancelled = true;
      revokeObjectUrl(imageUrlRef.current);
      imageUrlRef.current = null;
    };
  }, []);
  useEffect(() => {
    const applyPalette = () => {
      const palette = mode === 'auto' ? sitePaletteForLocalTime() : mode;
      document.documentElement.dataset.sitePalette = palette;
      document.documentElement.dataset.sitePaletteMode = mode;
      updateSiteFavicon(icons[palette]);
    };
    applyPalette();
    const intervalId = window.setInterval(applyPalette, 5 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, [icons, mode]);

  useEffect(() => {
    applyCustomBgDocumentState(customSettings, Boolean(customImageUrl), customTone);
  }, [customSettings, customImageUrl, customTone]);

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    const sync = () => setIsDesktopPointer(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!customSettings.enabled || customSettings.mode !== 'depth' || !customImageUrl || !isDesktopPointer) {
      document.documentElement.style.setProperty('--site-custom-bg-parallax', '0px');
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.style.setProperty('--site-custom-bg-parallax', '0px');
      return;
    }
    let frame = 0;
    let lastOffset = Number.NaN;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const offset = Math.max(-24, Math.min(24, window.scrollY * 0.04));
        const rounded = Math.round(offset * 2) / 2;
        if (rounded === lastOffset) return;
        lastOffset = rounded;
        document.documentElement.style.setProperty('--site-custom-bg-parallax', `${rounded.toFixed(1)}px`);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      document.documentElement.style.setProperty('--site-custom-bg-parallax', '0px');
    };
  }, [customSettings.enabled, customSettings.mode, customImageUrl, isDesktopPointer]);

  useEffect(() => {
    if (!expanded && !panelOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setExpanded(false);
        setPanelOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setExpanded(false);
        setPanelOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [expanded, panelOpen]);

  const chooseMode = (nextMode: SitePaletteMode) => {
    setMode(nextMode);
    setExpanded(false);
    setPanelOpen(false);
    if (customSettings.enabled) {
      const disabled = { ...customSettings, enabled: false };
      setCustomSettings(disabled);
      writeCustomBgSettings(disabled);
      applyCustomBgDocumentState(disabled, Boolean(customImageUrl), customTone);
    }
    if (nextMode === 'auto') {
      window.localStorage.removeItem(sitePaletteStorageKey);
      return;
    }
    window.localStorage.setItem(sitePaletteStorageKey, nextMode);
  };

  const persistCustom = (next: CustomBgSettings) => {
    // Overlay / mode / position are always local preferences.
    // Only site-wide image upload (and clear) require the owner password.
    setCustomSettings(next);
    if (!next.enabled) {
      clearCustomBgSettings();
      writeCustomBgSettings({ ...next, enabled: false });
    } else {
      writeCustomBgSettings(next);
    }
  };

  const openCustomPanel = () => {
    setPanelOpen(true);
    setExpanded(true);
    setError(null);
    if (customImageUrl && !customSettings.enabled) {
      const enabled = { ...customSettings, enabled: true };
      setCustomSettings(enabled);
      if (!(publishShared && sharedMeta?.writable)) writeCustomBgSettings(enabled);
      applyCustomBgDocumentState(enabled, true, customTone);
    }
    window.setTimeout(() => {
      const root = rootRef.current;
      if (!root) return;
      const focusable = root.querySelector<HTMLElement>('.site-custom-bg-action:not(:disabled), .site-custom-bg-panel select:not(:disabled), .site-custom-bg-panel input:not(:disabled)');
      focusable?.focus();
    }, 0);
  };

  const onCustomButtonClick = () => {
    if (prefersCoarsePalettePointer() && !panelOpen && customSettings.enabled && customImageUrl) {
      setExpanded((current) => !current);
      setPanelOpen((current) => !current);
      return;
    }
    openCustomPanel();
  };
  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    setScopeNote(isChinese ? '正在处理图片…' : 'Preparing image…');
    const uploadController = new AbortController();
    const uploadTimer = window.setTimeout(() => uploadController.abort(), WALLPAPER_UPLOAD_TIMEOUT_MS);
    try {
      const blob = await compressImageFile(file);
      setScopeNote(isChinese ? '正在分析亮度…' : 'Checking brightness…');
      const tone = toneFromLuminance(await estimateImageLuminance(blob));
      const nextSettings: CustomBgSettings = {
        ...customSettings,
        enabled: true,
        overlay: customSettings.enabled ? customSettings.overlay : DEFAULT_CUSTOM_BG_SETTINGS.overlay,
        mode: customSettings.mode === 'depth' && !isDesktopPointer ? 'cover' : customSettings.mode
      };
      const shouldPublish = Boolean(publishShared && sharedMeta?.writable);
      if (shouldPublish) {
        if (!ownerPassword || ownerPassword.length < 8) {
          setError(isChinese ? '请输入站长密码（至少 8 位）。' : 'Enter the owner password (at least 8 characters).');
          setScopeNote(null);
          return;
        }
        setScopeNote(isChinese ? '正在上传全站背景…' : 'Uploading site-wide background…');
        const body = new FormData();
        body.set('password', ownerPassword);
        const uploadMime = normalizeImageMimeType(blob.type, file.name) || blob.type || 'image/jpeg';
        const uploadName = `wallpaper.${imageExtensionForMime(uploadMime)}`;
        body.set('image', new File([blob], uploadName, { type: uploadMime }));
        body.set('mode', nextSettings.mode);
        body.set('overlay', String(nextSettings.overlay));
        body.set('position', nextSettings.position);
        body.set('tone', tone);
        body.set('enabled', 'true');
        const response = await fetch(SITE_WALLPAPER_API, {
          method: 'POST',
          credentials: 'same-origin',
          body,
          signal: uploadController.signal
        });
        if (!response.ok) {
          const fail =
            response.status === 401
              ? (isChinese ? '密码不正确。' : 'Incorrect password.')
              : response.status === 413
                ? (isChinese ? '图片太大，请换更小的图或先压缩。' : 'Image too large. Try a smaller file.')
                : response.status === 415 || response.status === 400
                  ? (isChinese ? '不支持的图片格式，请用 JPEG / PNG / WebP。' : 'Unsupported image type. Use JPEG, PNG, or WebP.')
                  : (isChinese ? '无法发布全站背景。' : 'Could not publish the site background.');
          setError(fail);
          setScopeNote(null);
          return;
        }
        const payload = (await response.json()) as SharedSiteBackgroundPublic;
        setSharedMeta(payload);
        await saveCustomBgBlob(blob);
        writeCustomBgSettings({ ...nextSettings, enabled: false });
        applySharedToUi(payload);
        setScopeNote(isChinese ? '已对所有访客生效。' : 'Visible to every visitor.');
        return;
      }
      await saveCustomBgBlob(blob);
      const url = URL.createObjectURL(blob);
      revokeObjectUrl(imageUrlRef.current);
      imageUrlRef.current = url;
      setCustomImageUrl(url);
      setCustomTone(tone);
      persistCustom(nextSettings);
      setScopeNote(isChinese ? '仅此设备。' : 'This device only.');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Upload failed';
      const aborted = cause instanceof DOMException && cause.name === 'AbortError';
      if (aborted || /timed out/i.test(message)) {
        setError(isChinese ? '上传超时，请换一张更小的图后重试。' : 'Upload timed out. Try a smaller image.');
      } else if (/large/i.test(message)) {
        setError(isChinese ? '图片压缩后仍然太大，请换一张更小的图。' : 'Image is still too large after compression.');
      } else {
        setError(isChinese ? '无法使用这张图片，请试 JPEG / PNG / WebP。' : 'Could not use that image. Try JPEG, PNG, or WebP.');
      }
      setScopeNote(null);
    } finally {
      window.clearTimeout(uploadTimer);
      setBusy(false);
    }
  };

  const clearCustom = async () => {
    setBusy(true);
    setError(null);
    setScopeNote(null);
    try {
      const shouldClearShared = Boolean(publishShared && sharedMeta?.writable && sharedMeta.enabled);
      if (shouldClearShared) {
        if (!ownerPassword || ownerPassword.length < 8) {
          setError(isChinese ? '请输入站长密码（至少 8 位）。' : 'Enter the owner password (at least 8 characters).');
          return;
        }
        const response = await fetch(SITE_WALLPAPER_API, {
          method: 'DELETE',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: (() => { const payload: Record<string, string> = {}; payload['password'] = ownerPassword; return JSON.stringify(payload); })()
        });
        if (!response.ok) {
          setError(response.status === 401
            ? (isChinese ? '密码不正确。' : 'Incorrect password.')
            : (isChinese ? '无法清除全站背景。' : 'Could not clear the site background.'));
          return;
        }
        const payload = (await response.json()) as SharedSiteBackgroundPublic;
        setSharedMeta(payload);
      }
      await deleteCustomBgBlob();
      revokeObjectUrl(imageUrlRef.current);
      imageUrlRef.current = null;
      setCustomImageUrl(null);
      setCustomTone(null);
      persistCustom({ ...DEFAULT_CUSTOM_BG_SETTINGS, enabled: false });
      setPanelOpen(false);
      setScopeNote(shouldClearShared
        ? (isChinese ? '全站背景已清除。' : 'Site-wide background cleared.')
        : (isChinese ? '已清除此设备上的背景。' : 'Cleared on this device.'));
    } catch {
      setError(isChinese ? '清除失败，请重试。' : 'Could not clear the background.');
    } finally {
      setBusy(false);
    }
  };

  const customActive = Boolean(customSettings.enabled && customImageUrl);
  const [ssrWallpaperAdopted, setSsrWallpaperAdopted] = useState(() => {
    if (initialSharedBackground?.enabled && cssUrlForSharedImage(initialSharedBackground.imageUrl)) return true;
    return typeof document !== 'undefined' && Boolean(document.querySelector('[data-ssr-wallpaper]'));
  });
  useLayoutEffect(() => {
    const ssr = document.querySelector<HTMLElement>('[data-ssr-wallpaper]');
    if (!ssr) return;
    ssr.className = ['site-custom-bg-layer', customActive ? 'is-active' : ''].filter(Boolean).join(' ');
    ssr.style.backgroundImage = customImageUrl
      ? `url("${customImageUrl}")`
      : 'var(--site-custom-bg-image, none)';
    setSsrWallpaperAdopted(true);
  }, [customActive, customImageUrl]);
  const layerStyle = {
    backgroundImage: customImageUrl ? `url("${customImageUrl}")` : 'var(--site-custom-bg-image, none)'
  } as CSSProperties;

  const copy = {
    custom: isChinese ? '自定义背景' : 'Custom background',
    upload: isChinese ? '上传图片' : 'Upload image',
    change: isChinese ? '更换图片' : 'Change image',
    clear: isChinese ? '清除' : 'Clear',
    mode: isChinese ? '适配' : 'Fit',
    overlay: isChinese ? '遮罩' : 'Overlay',
    position: isChinese ? '焦点' : 'Focus',
    busy: isChinese ? '处理中…' : 'Working…',
    group: isChinese ? '站点配色与背景' : 'Site color theme and background',
    password: isChinese ? '站长密码' : 'Owner password',
    passwordHint: isChinese ? '仅全站上传图片时需要' : 'Required only to upload a site-wide image',
    scopeShared: isChinese ? '全站可见' : 'Everyone',
    scopeLocal: isChinese ? '仅此设备' : 'This device',
    scopeLabel: isChinese ? '范围' : 'Scope',
    scopeHintLocal: isChinese ? '本地预览：输入任意密码（≥ 8 位）可将图片写入 public/site-wallpaper。透明度等控件无需密码。' : 'Local preview: enter any password (≥8 chars) only to publish the image into public/site-wallpaper. Overlay and other controls need no password.',
    scopeHintPassword: isChinese ? '仅全站上传或清除背景图时需要站长密码；透明度、模式等可自由调整。' : 'Owner password is only for uploading or clearing the site-wide image. Overlay, mode, and position stay free.',
    scopeHintMissing: isChinese
      ? '当前环境未开放全站写入。生产需配置 Redis、站长密码哈希，以及 the Vercel Blob RW token env。'
      : 'Shared writes are unavailable here. Production needs Redis, owner password hash, and the Vercel Blob RW token env.'
  };
  return (
    <>
      {!ssrWallpaperAdopted && (
        <div
          aria-hidden="true"
          className={['site-custom-bg-layer', customActive ? 'is-active' : ''].filter(Boolean).join(' ')}
          style={layerStyle}
        />
      )}
      <div
        ref={rootRef}
        className={['site-palette-root', panelOpen ? 'is-panel-open' : ''].filter(Boolean).join(' ')}
      >
      <div
        aria-expanded={expanded || panelOpen}
        aria-label={copy.group}
        className={['site-palette-switcher', (expanded || panelOpen) ? 'is-expanded' : ''].filter(Boolean).join(' ')}
        role="group"
      >
        {sitePaletteOptions.map((option) => {
          const pressed = mode === option.mode;
          const active = mode === option.mode;
          const style = { '--site-palette-swatch': option.color } as CSSProperties;
          return (
            <button
              aria-label={option.title}
              aria-pressed={pressed}
              className={['site-palette-button', active ? 'is-active' : '', option.mode === 'text' ? 'site-palette-text' : '', option.mode === 'auto' ? 'site-palette-auto' : '']
                .filter(Boolean)
                .join(' ')}
              key={option.mode}
              onClick={() => {
                if (active && prefersCoarsePalettePointer()) {
                  setExpanded((current) => !current);
                  setPanelOpen(false);
                  return;
                }
                chooseMode(option.mode);
              }}
              style={style}
              title={option.title}
              type="button"
            >
              <span className="sr-only">{option.title}</span>
            </button>
          );
        })}
        <button
          aria-controls={panelId}
          aria-expanded={panelOpen}
          aria-label={copy.custom}
          aria-pressed={customActive}
          className={['site-palette-button', 'site-palette-custom', customActive ? 'is-custom-on' : '', panelOpen ? 'is-panel-trigger' : '']
            .filter(Boolean)
            .join(' ')}
          onClick={onCustomButtonClick}
          title={copy.custom}
          type="button"
        >
          <span className="sr-only">{copy.custom}</span>
          <span aria-hidden="true" className="site-palette-custom-glyph">
            <svg viewBox="0 0 16 16" width="12" height="12" focusable="false">
              <rect x="1.5" y="2.5" width="13" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.25" />
              <circle cx="5.5" cy="6" r="1.25" fill="currentColor" />
              <path d="M2.75 12.2 6.1 8.4a.7.7 0 0 1 1.02-.02L9.2 10.4l1.2-1.3a.7.7 0 0 1 1.04.02L13.4 12.2" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      </div>
      {panelOpen ? (
        <div className="site-custom-bg-panel" id={panelId} role="region" aria-label={copy.custom}>
          <div className="site-custom-bg-panel-head">
            <p className="site-custom-bg-panel-title">{copy.custom}</p>
            {scopeNote ? <p className="site-custom-bg-panel-note">{scopeNote}</p> : null}
          </div>
          <label className="site-custom-bg-field">
            <span className="site-custom-bg-field-label">{copy.scopeLabel}</span>
            <select
              disabled={busy || !(sharedMeta?.writable)}
              onChange={(event) => setPublishShared(event.target.value === 'shared')}
              value={publishShared && sharedMeta?.writable ? 'shared' : 'local'}
            >
              <option value="shared">{copy.scopeShared}</option>
              <option value="local">{copy.scopeLocal}</option>
            </select>
          </label>
          {!sharedMeta?.writable ? (
            <p className="site-custom-bg-panel-note">{copy.scopeHintMissing}</p>
          ) : null}
          {sharedMeta?.writable && publishShared ? (
            <label className="site-custom-bg-field">
              <span className="site-custom-bg-field-label">{copy.password}</span>
              <input
                autoComplete="current-password"
                className="site-custom-bg-password"
                disabled={busy}
                onChange={(event) => {
                  setOwnerPassword(event.target.value);
                  setError(null);
                }}
                placeholder={copy.passwordHint}
                type="password"
                value={ownerPassword}
              />
            </label>
          ) : null}
          {sharedMeta?.writable && publishShared ? (
            <p className="site-custom-bg-panel-note">
              {copy[sharedMeta.passwordRequired ? 'scopeHintPassword' : 'scopeHintLocal']}
            </p>
          ) : null}
          <div className="site-custom-bg-panel-row">
            <button className="site-custom-bg-action" disabled={busy} onClick={() => fileInputRef.current?.click()} type="button">
              {busy ? copy.busy : (customImageUrl ? copy.change : copy.upload)}
            </button>
            {customImageUrl ? (
              <button className="site-custom-bg-action site-custom-bg-action-muted" disabled={busy} onClick={() => void clearCustom()} type="button">{copy.clear}</button>
            ) : null}
          </div>
          <input accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => void onFileChange(event)} ref={fileInputRef} type="file" />
          {customImageUrl ? <div aria-hidden="true" className="site-custom-bg-thumb" style={{ backgroundImage: `url("${customImageUrl}")` }} /> : null}
          {customImageUrl ? (
            <div className="site-custom-bg-controls">
              <label className="site-custom-bg-field">
                <span className="site-custom-bg-field-label">{copy.mode}</span>
                <select disabled={busy || !customImageUrl} onChange={(event) => {
                  const nextMode = event.target.value as CustomBgMode;
                  if (nextMode === 'depth' && !isDesktopPointer) {
                    persistCustom({ ...customSettings, enabled: true, mode: 'cover' });
                    return;
                  }
                  persistCustom({ ...customSettings, enabled: Boolean(customImageUrl), mode: nextMode });
                }} value={customSettings.mode}>
                  {customBgModeOptions.map((option) => (
                    <option disabled={option.mode === 'depth' && !isDesktopPointer} key={option.mode} value={option.mode}>{isChinese ? option.zh : option.en}</option>
                  ))}
                </select>
              </label>
              <label className="site-custom-bg-field">
                <span className="site-custom-bg-field-label">{copy.overlay}<span className="site-custom-bg-field-value">{customSettings.overlay}%</span></span>
                <input disabled={busy || !customImageUrl} max={100} min={0} onChange={(event) => persistCustom({ ...customSettings, enabled: Boolean(customImageUrl), overlay: Number(event.target.value) })} type="range" value={customSettings.overlay} />
              </label>
              <label className="site-custom-bg-field">
                <span className="site-custom-bg-field-label">{copy.position}</span>
                <select disabled={busy || !customImageUrl || customSettings.mode === 'tile'} onChange={(event) => persistCustom({ ...customSettings, enabled: Boolean(customImageUrl), position: event.target.value as CustomBgPosition })} value={customSettings.position}>
                  {customBgPositionOptions.map((option) => (
                    <option key={option.position} value={option.position}>{isChinese ? option.zh : option.en}</option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
          {error ? <p className="site-custom-bg-error" role="alert">{error}</p> : null}
        </div>
      ) : null}
      </div>
    </>
  );
}
