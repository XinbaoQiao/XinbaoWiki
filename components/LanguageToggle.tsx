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
import {
  CHARACTER_OCEAN_ACTIVE_STYLES,
  CHARACTER_OCEAN_STORAGE_KEY,
  DEFAULT_CHARACTER_OCEAN,
  DEFAULT_OCEAN_SHARK_KINDS,
  OCEAN_SHARK_KINDS,
  characterOceanLabels,
  characterOceanMobileMediaQuery,
  clampOceanDensity,
  clampOceanOpacity,
  parseCharacterOceanSettings,
  siteBackgroundComposeMode,
  type CharacterOceanSettings,
  type CharacterOceanStyle,
  type OceanSharkKind
} from '@/lib/site-character-ocean';

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

  return wikiIndex >= 0 && parts[wikiIndex + 1] ? parts[wikiIndex + 1] : 'Xinbao_Qiao';

}



function isChineseSlug(slug: string) {

  return slug === 'Qiao_Xinbao_zh' || slug.endsWith('_zh');

}



function chineseSlug(slug: string) {

  if (slug === 'Xinbao_Qiao') return 'Qiao_Xinbao_zh';

  if (isChineseSlug(slug)) return slug;

  return `${slug}_zh`;

}



function englishSlug(slug: string) {

  if (slug === 'Qiao_Xinbao_zh') return 'Xinbao_Qiao';

  return slug.endsWith('_zh') ? slug.slice(0, -3) : slug;

}



export function LanguageToggle() {

  const pathname = usePathname() || '';

  const isWikiPage = decodeURIComponent(pathname).split('/').includes('wiki');

  const slug = activeSlug(pathname);

  const isChinesePage = isChineseSlug(slug);



  useEffect(() => {
    // Wiki pages own document lang from the slug. Homepage / non-wiki chrome
    // is owned by HomepagePortal — do not force 'en' here or ZH ocean glyphs never arm.
    if (!isWikiPage) return;
    document.documentElement.lang = isChinesePage ? 'zh-CN' : 'en';
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



const sitePaletteStorageKey = 'xinbaopedia-palette-mode';



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
  // Keep shared wallpaper URL available, but do not force it on first open.
  const initialSharedUrl = cssUrlForSharedImage(initialSharedBackground?.imageUrl ?? null);
  const initialSharedSettings = initialSharedUrl
    ? { ...sharedBackgroundToSettings(initialSharedBackground!), enabled: false }
    : DEFAULT_CUSTOM_BG_SETTINGS;
  const [mode, setMode] = useState<SitePaletteMode>('auto');
  const [characterOcean, setCharacterOcean] = useState<CharacterOceanSettings>({ ...DEFAULT_CHARACTER_OCEAN, kinds: [...DEFAULT_CHARACTER_OCEAN.kinds] });
  const [oceanPanelOpen, setOceanPanelOpen] = useState(false);
  const [oceanMobileOff, setOceanMobileOff] = useState(false);
  const [oceanStyleBeforeOff, setOceanStyleBeforeOff] = useState<Exclude<CharacterOceanStyle, 'off'>>('ascii');
  const [expanded, setExpanded] = useState(false);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
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
  const colorMenuCloseTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUrlRef = useRef<string | null>(null);
  const panelId = useId();
  const oceanPanelId = useId();
  const isChinese = useChromeChinese();

  const loadSharedImageOnly = (shared: SharedSiteBackgroundPublic) => {
    const safeUrl = cssUrlForSharedImage(shared.imageUrl);
    if (!safeUrl) {
      setCustomImageUrl(null);
      setCustomTone(null);
      return false;
    }
    revokeObjectUrl(imageUrlRef.current);
    imageUrlRef.current = null;
    setCustomImageUrl(safeUrl);
    setCustomTone(shared.tone);
    setCustomSettings({ ...sharedBackgroundToSettings(shared), enabled: false });
    applyCustomBgDocumentState({ ...sharedBackgroundToSettings(shared), enabled: false }, false, shared.tone);
    return true;
  };

  const applySharedToUi = (shared: SharedSiteBackgroundPublic, forceOn = true) => {
    const safeUrl = cssUrlForSharedImage(shared.imageUrl);
    if (!safeUrl) {
      setCustomImageUrl(null);
      setCustomTone(null);
      applyCustomBgDocumentState({ ...DEFAULT_CUSTOM_BG_SETTINGS, enabled: false }, false, null);
      return;
    }
    revokeObjectUrl(imageUrlRef.current);
    imageUrlRef.current = null;
    setCustomImageUrl(safeUrl);
    setCustomTone(shared.tone);
    const settings = { ...sharedBackgroundToSettings(shared), enabled: forceOn };
    setCustomSettings(settings);
    applyCustomBgDocumentState(settings, forceOn, shared.tone);
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
      const savedOcean = window.localStorage.getItem(CHARACTER_OCEAN_STORAGE_KEY);
      const loadedOcean = parseCharacterOceanSettings(savedOcean);
      // Default is on (ascii). Honor an explicit off saved in localStorage.
      setCharacterOcean(loadedOcean);
      if (loadedOcean.style !== 'off') setOceanStyleBeforeOff(loadedOcean.style);
    const savedCustom = readCustomBgSettings();
    setCustomSettings(savedCustom);
    if (initialSharedBackground) {
      setSharedMeta(initialSharedBackground);
      setPublishShared(Boolean(initialSharedBackground.writable));
      // Default: mixed/auto palette. Keep shared wallpaper URL for opt-in switch.
      if (initialSharedBackground.imageUrl) {
        loadSharedImageOnly(initialSharedBackground);
        setScopeNote(isChinese ? '已保存全站壁纸，点击可切换。' : 'Saved site wallpaper available — click to switch.');
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
      const shared = initialSharedBackground ?? (await refreshSharedBackground());
      if (initialSharedBackground) {
        void refreshSharedBackground().then((payload) => {
          if (cancelled || !payload) return;
          if (localEnabled && imageUrlRef.current?.startsWith('blob:')) return;
          if (payload.imageUrl) {
            if (savedCustom.enabled) {
              applySharedToUi(payload, true);
              setScopeNote(isChinese ? '已切换到全站壁纸。' : 'Using saved site wallpaper.');
            } else {
              loadSharedImageOnly(payload);
            }
          }
        });
      }
      if (cancelled) { revokeObjectUrl(localUrl); return; }
      // Local opt-in only — never force shared wallpaper on first open.
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
      if (savedCustom.enabled && shared?.imageUrl) {
        revokeObjectUrl(localUrl);
        applySharedToUi(shared, true);
        setScopeNote(isChinese ? '已切换到全站壁纸。' : 'Using saved site wallpaper.');
        return;
      }
      if (shared?.imageUrl) {
        revokeObjectUrl(localUrl);
        loadSharedImageOnly(shared);
        setScopeNote(isChinese ? '已保存全站壁纸，点击可切换。' : 'Saved site wallpaper available — click to switch.');
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
      setCustomTone(null);
      applyCustomBgDocumentState({ ...savedCustom, enabled: false }, false, null);
    };
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
    const media = window.matchMedia(characterOceanMobileMediaQuery());
    const sync = () => {
      const off = media.matches;
      setOceanMobileOff(off);
      if (off) setOceanPanelOpen(false);
    };
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
    if (!expanded && !panelOpen && !oceanPanelOpen && !colorMenuOpen) return;
    function clearColorMenuTimer() {
      if (colorMenuCloseTimerRef.current != null) {
        window.clearTimeout(colorMenuCloseTimerRef.current);
        colorMenuCloseTimerRef.current = null;
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        clearColorMenuTimer();
        setExpanded(false);
        setPanelOpen(false);
        setOceanPanelOpen(false);
        setColorMenuOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        clearColorMenuTimer();
        setExpanded(false);
        setPanelOpen(false);
        setOceanPanelOpen(false);
        setColorMenuOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [expanded, panelOpen, oceanPanelOpen, colorMenuOpen]);

  useEffect(() => () => {
    if (colorMenuCloseTimerRef.current != null) {
      window.clearTimeout(colorMenuCloseTimerRef.current);
      colorMenuCloseTimerRef.current = null;
    }
  }, []);

  const chooseMode = (nextMode: SitePaletteMode) => {
    setMode(nextMode);
    setExpanded(false);
    setPanelOpen(false);
    setOceanPanelOpen(false);
    if (colorMenuCloseTimerRef.current != null) {
      window.clearTimeout(colorMenuCloseTimerRef.current);
      colorMenuCloseTimerRef.current = null;
    }
    setColorMenuOpen(false);
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
    setOceanPanelOpen(false);
    setPanelOpen(true);
    setExpanded(true);
    setError(null);
    if (customImageUrl && !customSettings.enabled) {
      const enabled = { ...customSettings, enabled: true };
      setCustomSettings(enabled);
      // Always persist local opt-in so image mode sticks on this device.
      // Shared upload/clear still require the owner password; this flag is device-local.
      writeCustomBgSettings(enabled);
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
  // Only treat SSR wallpaper as adopted when the layout actually rendered that node.
  // Shared wallpaper may be enabled server-side while visitors still default to mixed;
  // in that case we must mount the client layer or opt-in never paints an image.
  const [ssrWallpaperAdopted, setSsrWallpaperAdopted] = useState(() => {
    return typeof document !== 'undefined' && Boolean(document.querySelector('[data-ssr-wallpaper]'));
  });
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (customImageUrl) {
      root.style.setProperty('--site-custom-bg-image', `url("${customImageUrl}")`);
    } else {
      root.style.removeProperty('--site-custom-bg-image');
    }
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
    color: isChinese ? '颜色' : 'Color',
    colorMenu: isChinese ? '选择配色' : 'Choose color theme',
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
      : 'Shared writes are unavailable here. Production needs Redis, owner password hash, and the Vercel Blob RW token env.',
    oceanGroup: isChinese ? characterOceanLabels.zh.group : characterOceanLabels.en.group,
    oceanEnable: isChinese ? characterOceanLabels.zh.enable : characterOceanLabels.en.enable,
    oceanDensity: isChinese ? characterOceanLabels.zh.density : characterOceanLabels.en.density,
    oceanOpacity: isChinese ? characterOceanLabels.zh.opacity : characterOceanLabels.en.opacity,
    oceanStyle: isChinese ? characterOceanLabels.zh.style : characterOceanLabels.en.style,
    oceanHint: isChinese ? characterOceanLabels.zh.hint : characterOceanLabels.en.hint,
    oceanKinds: isChinese ? characterOceanLabels.zh.kinds : characterOceanLabels.en.kinds,
    oceanKindsHint: isChinese ? characterOceanLabels.zh.kindsHint : characterOceanLabels.en.kindsHint,
    oceanKindsAll: isChinese ? characterOceanLabels.zh.kindsAll : characterOceanLabels.en.kindsAll,
    oceanKindsDefault: isChinese ? characterOceanLabels.zh.kindsDefault : characterOceanLabels.en.kindsDefault,
  };
  const persistOcean = (next: CharacterOceanSettings) => {
    setCharacterOcean(next);
    if (next.style !== 'off') setOceanStyleBeforeOff(next.style);
  };

  const openOceanPanel = () => {
    if (oceanMobileOff) return;
    setPanelOpen(false);
    setOceanPanelOpen(true);
    setExpanded(true);
    window.setTimeout(() => {
      const root = rootRef.current;
      if (!root) return;
      const focusable = root.querySelector<HTMLElement>(
        '.site-ocean-panel select:not(:disabled), .site-ocean-panel input:not(:disabled), .site-ocean-toggle',
      );
      focusable?.focus();
    }, 0);
  };

  useEffect(() => {
    // Mobile temporarily disables the ocean field: keep user preference in
    // state/localStorage, but force DOM compose attrs to off so portal chrome
    // is not left transparent without a canvas.
    const effectiveStyle = oceanMobileOff ? 'off' : characterOcean.style;
    const oceanOn = effectiveStyle !== 'off';
    const wallpaperOn = Boolean(customSettings.enabled && customImageUrl);
    document.documentElement.dataset.siteCharacterOcean = effectiveStyle;
    document.documentElement.dataset.siteOceanDensity = String(characterOcean.density);
    document.documentElement.dataset.siteOceanOpacity = String(characterOcean.opacity);
    document.documentElement.dataset.siteOceanKinds = JSON.stringify(characterOcean.kinds);
    document.documentElement.dataset.siteOceanMobile = oceanMobileOff ? '1' : '0';
    document.documentElement.dataset.siteBgCompose = siteBackgroundComposeMode({ oceanOn, wallpaperOn });
    document.documentElement.style.setProperty('--site-ocean-opacity', String(characterOcean.opacity));
    try {
      window.localStorage.setItem(CHARACTER_OCEAN_STORAGE_KEY, JSON.stringify(characterOcean));
    } catch {
      /* ignore quota */
    }
  }, [characterOcean, customSettings.enabled, customImageUrl, oceanMobileOff]);

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
        className={['site-palette-root', (panelOpen || oceanPanelOpen || colorMenuOpen) ? 'is-panel-open' : ''].filter(Boolean).join(' ')}
      >
      <div
        aria-expanded={expanded || panelOpen || oceanPanelOpen || colorMenuOpen}
        aria-label={copy.group}
        className={['site-palette-switcher', (expanded || panelOpen || oceanPanelOpen || colorMenuOpen) ? 'is-expanded' : ''].filter(Boolean).join(' ')}
        role="group"
      >
        {(() => {
          const activeOption = sitePaletteOptions.find((option) => option.mode === mode) ?? sitePaletteOptions[sitePaletteOptions.length - 1];
          const colorStyle = { '--site-palette-swatch': activeOption.color } as CSSProperties;
          const colorMenuId = `${panelId}-color-menu`;
          return (
            <div
              className={['site-palette-color-wrap', colorMenuOpen ? 'is-color-menu-open' : ''].filter(Boolean).join(' ')}
              onBlur={(event) => {
                const next = event.relatedTarget as Node | null;
                if (next && event.currentTarget.contains(next)) return;
                if (colorMenuCloseTimerRef.current != null) {
                  window.clearTimeout(colorMenuCloseTimerRef.current);
                  colorMenuCloseTimerRef.current = null;
                }
                setColorMenuOpen(false);
              }}
              onFocus={() => {
                // Coarse uses tap-to-toggle; auto-open on focus would race the click and immediately close.
                if (prefersCoarsePalettePointer()) return;
                if (colorMenuCloseTimerRef.current != null) {
                  window.clearTimeout(colorMenuCloseTimerRef.current);
                  colorMenuCloseTimerRef.current = null;
                }
                setColorMenuOpen(true);
              }}
              onMouseEnter={() => {
                if (prefersCoarsePalettePointer()) return;
                if (colorMenuCloseTimerRef.current != null) {
                  window.clearTimeout(colorMenuCloseTimerRef.current);
                  colorMenuCloseTimerRef.current = null;
                }
                setColorMenuOpen(true);
              }}
              onMouseLeave={() => {
                if (prefersCoarsePalettePointer()) return;
                if (colorMenuCloseTimerRef.current != null) {
                  window.clearTimeout(colorMenuCloseTimerRef.current);
                }
                colorMenuCloseTimerRef.current = window.setTimeout(() => {
                  colorMenuCloseTimerRef.current = null;
                  setColorMenuOpen(false);
                }, 160);
              }}
            >
              <button
                aria-controls={colorMenuId}
                aria-expanded={colorMenuOpen}
                aria-haspopup="listbox"
                aria-label={copy.color}
                className={[
                  'site-palette-button',
                  'site-palette-color-trigger',
                  activeOption.mode === 'text' ? 'site-palette-text' : '',
                  activeOption.mode === 'auto' ? 'site-palette-auto' : '',
                  colorMenuOpen ? 'is-panel-trigger' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  setPanelOpen(false);
                  setOceanPanelOpen(false);
                  if (prefersCoarsePalettePointer()) {
                    setColorMenuOpen((current) => !current);
                    setExpanded(true);
                    return;
                  }
                  setColorMenuOpen(true);
                }}
                style={colorStyle}
                title={copy.color}
                type="button"
              >
                <span className="sr-only">{copy.color}</span>
              </button>
              <div
                aria-label={copy.colorMenu}
                className="site-palette-color-menu"
                id={colorMenuId}
                role="listbox"
              >
                {sitePaletteOptions.map((option) => {
                  const active = mode === option.mode;
                  const style = { '--site-palette-swatch': option.color } as CSSProperties;
                  return (
                    <button
                      aria-label={option.title}
                      aria-selected={active}
                      className={[
                        'site-palette-button',
                        'site-palette-color-option',
                        active ? 'is-active' : '',
                        option.mode === 'text' ? 'site-palette-text' : '',
                        option.mode === 'auto' ? 'site-palette-auto' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      key={option.mode}
                      onClick={() => chooseMode(option.mode)}
                      role="option"
                      style={style}
                      tabIndex={colorMenuOpen ? 0 : -1}
                      title={option.title}
                      type="button"
                    >
                      <span className="sr-only">{option.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
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
        {!oceanMobileOff ? (
        <button
          aria-controls={oceanPanelId}
          aria-expanded={oceanPanelOpen}
          aria-label={copy.oceanGroup}
          aria-pressed={characterOcean.style !== 'off'}
          className={[
            'site-palette-button',
            'site-palette-ocean',
            characterOcean.style !== 'off' ? 'is-ocean-on' : '',
            oceanPanelOpen ? 'is-panel-trigger' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => {
            if (oceanPanelOpen) {
              setOceanPanelOpen(false);
              return;
            }
            openOceanPanel();
          }}
          title={copy.oceanGroup}
          type="button"
        >
          <span className="sr-only">{copy.oceanGroup}</span>
          <span aria-hidden="true" className="site-palette-ocean-glyph">
            <svg viewBox="0 0 16 16" width="12" height="12" focusable="false">
              <path d="M1.5 10.2c1.4-1.2 2.7-1.8 4-1.8s2.6.6 4 1.8c1.4 1.2 2.7 1.8 4 1.8" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
              <path d="M1.5 6.8c1.4-1.2 2.7-1.8 4-1.8s2.6.6 4 1.8c1.4 1.2 2.7 1.8 4 1.8" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
              <circle cx="11.2" cy="4.2" r="1.1" fill="currentColor" />
            </svg>
          </span>
        </button>
        ) : null}
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
      {oceanPanelOpen && !oceanMobileOff ? (
        <div className="site-ocean-panel" id={oceanPanelId} role="region" aria-label={copy.oceanGroup}>
          <div className="site-ocean-panel-head">
            <p className="site-ocean-panel-title">{copy.oceanGroup}</p>
            <p className="site-ocean-panel-note">{copy.oceanHint}</p>
          </div>
          <div className="site-ocean-toggle-row">
            <span className="site-custom-bg-field-label">{copy.oceanEnable}</span>
            <button
              aria-pressed={characterOcean.style !== 'off'}
              className={['site-ocean-toggle', characterOcean.style !== 'off' ? 'is-on' : ''].filter(Boolean).join(' ')}
              onClick={() => {
                if (characterOcean.style === 'off') {
                  persistOcean({ ...characterOcean, style: oceanStyleBeforeOff });
                } else {
                  setOceanStyleBeforeOff(characterOcean.style);
                  persistOcean({ ...characterOcean, style: 'off' });
                }
              }}
              title={copy.oceanEnable}
              type="button"
            />
          </div>
          <label className="site-custom-bg-field">
            <span className="site-custom-bg-field-label">{copy.oceanStyle}</span>
            <select
              disabled={characterOcean.style === 'off'}
              onChange={(event) => {
                const nextStyle = event.target.value as Exclude<CharacterOceanStyle, 'off'>;
                persistOcean({ ...characterOcean, style: nextStyle });
              }}
              value={characterOcean.style === 'off' ? oceanStyleBeforeOff : characterOcean.style}
            >
              {CHARACTER_OCEAN_ACTIVE_STYLES.map((styleKey) => {
                const labels = isChinese ? characterOceanLabels.zh : characterOceanLabels.en;
                return (
                  <option key={styleKey} value={styleKey}>
                    {labels[styleKey]}
                  </option>
                );
              })}
            </select>
          </label>
          <label className="site-custom-bg-field">
            <span className="site-custom-bg-field-label">
              {copy.oceanDensity}
              <span className="site-custom-bg-field-value">{Math.round(characterOcean.density * 100)}%</span>
            </span>
            <input
              disabled={characterOcean.style === 'off'}
              max={200}
              min={35}
              onChange={(event) => {
                persistOcean({
                  ...characterOcean,
                  density: clampOceanDensity(Number(event.target.value) / 100),
                });
              }}
              type="range"
              value={Math.round(characterOcean.density * 100)}
            />
          </label>
          <label className="site-custom-bg-field">
            <span className="site-custom-bg-field-label">
              {copy.oceanOpacity}
              <span className="site-custom-bg-field-value">{Math.round(characterOcean.opacity * 100)}%</span>
            </span>
            <input
              disabled={characterOcean.style === 'off'}
              max={100}
              min={20}
              onChange={(event) => {
                persistOcean({
                  ...characterOcean,
                  opacity: clampOceanOpacity(Number(event.target.value) / 100),
                });
              }}
              type="range"
              value={Math.round(characterOcean.opacity * 100)}
            />
          </label>

          <div className="site-ocean-kinds">
            <div className="site-ocean-kinds-head">
              <span className="site-custom-bg-field-label">{copy.oceanKinds}</span>
              <span className="site-ocean-kinds-actions">
                <button
                  className="site-ocean-kinds-action"
                  disabled={characterOcean.style === 'off'}
                  onClick={() => persistOcean({ ...characterOcean, kinds: [...OCEAN_SHARK_KINDS] })}
                  type="button"
                >
                  {copy.oceanKindsAll}
                </button>
                <button
                  className="site-ocean-kinds-action"
                  disabled={characterOcean.style === 'off'}
                  onClick={() => persistOcean({ ...characterOcean, kinds: [...DEFAULT_OCEAN_SHARK_KINDS] })}
                  type="button"
                >
                  {copy.oceanKindsDefault}
                </button>
              </span>
            </div>
            <p className="site-ocean-panel-note">{copy.oceanKindsHint}</p>
            <div className="site-ocean-kinds-grid" role="group" aria-label={copy.oceanKinds}>
              {OCEAN_SHARK_KINDS.map((kind) => {
                const labels = isChinese ? characterOceanLabels.zh : characterOceanLabels.en;
                const on = characterOcean.kinds.includes(kind);
                return (
                  <button
                    aria-pressed={on}
                    className={['site-ocean-kind-chip', on ? 'is-on' : ''].filter(Boolean).join(' ')}
                    disabled={characterOcean.style === 'off'}
                    key={kind}
                    onClick={() => {
                      const has = characterOcean.kinds.includes(kind);
                      if (has) {
                        if (characterOcean.kinds.length <= 1) return;
                        persistOcean({
                          ...characterOcean,
                          kinds: characterOcean.kinds.filter((k) => k !== kind),
                        });
                      } else {
                        persistOcean({
                          ...characterOcean,
                          kinds: [...characterOcean.kinds, kind],
                        });
                      }
                    }}
                    title={labels[kind]}
                    type="button"
                  >
                    {labels[kind]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </>
  );
}
