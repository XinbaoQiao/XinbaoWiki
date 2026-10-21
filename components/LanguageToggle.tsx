'use client';

import { WikiLink } from '@/components/WikiLink';
import { clearWikiMorphIntent } from '@/lib/wiki-view-transition';
import {
  applyCustomBgDocumentState,
  clearCustomBgSettings,
  compressImageFile,
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
import type { CSSProperties, ChangeEvent } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
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

function useChromeChinese(): boolean {
  const pathname = usePathname() || '';
  const [isChinese, setIsChinese] = useState(false);

  useEffect(() => {
    const fromPath = (() => {
      const decoded = decodeURIComponent(pathname);
      if (decoded.split('/').includes('wiki')) {
        return isChineseSlug(activeSlug(pathname));
      }
      return document.documentElement.lang === 'zh-CN';
    })();
    setIsChinese(fromPath);
  }, [pathname]);

  return isChinese;
}

const customBgModeOptions: Array<{ mode: CustomBgMode; en: string; zh: string }> = [
  { mode: 'cover', en: 'Cover', zh: '铺满' },
  { mode: 'soft-fade', en: 'Soft fade', zh: '柔和淡出' },
  { mode: 'tile', en: 'Tile', zh: '平铺' },
  { mode: 'depth', en: 'Depth (desktop)', zh: '景深（桌面）' }
];

const customBgPositionOptions: Array<{ position: CustomBgPosition; en: string; zh: string }> = [
  { position: 'top', en: 'Top', zh: '顶部' },
  { position: 'center', en: 'Center', zh: '居中' },
  { position: 'bottom', en: 'Bottom', zh: '底部' }
];

export function SitePalette({ icons }: SitePaletteProps) {
  const [mode, setMode] = useState<SitePaletteMode>('auto');
  const [expanded, setExpanded] = useState(false);
  const [customSettings, setCustomSettings] = useState<CustomBgSettings>(DEFAULT_CUSTOM_BG_SETTINGS);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [customTone, setCustomTone] = useState<CustomBgTone | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDesktopPointer, setIsDesktopPointer] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUrlRef = useRef<string | null>(null);
  const panelId = useId();
  const isChinese = useChromeChinese();

  useEffect(() => {
    const savedMode = window.localStorage.getItem(sitePaletteStorageKey);

    if (isSitePaletteMode(savedMode)) {
      setMode(savedMode);
    }

    const savedCustom = readCustomBgSettings();
    setCustomSettings(savedCustom);

    let cancelled = false;
    void (async () => {
      try {
        const blob = await loadCustomBgBlob();
        if (cancelled) return;
        if (!blob) {
          setCustomTone(null);
          applyCustomBgDocumentState({ ...savedCustom, enabled: false }, false, null);
          return;
        }
        const url = URL.createObjectURL(blob);
        const tone = toneFromLuminance(await estimateImageLuminance(blob));
        if (cancelled) {
          revokeObjectUrl(url);
          return;
        }
        revokeObjectUrl(imageUrlRef.current);
        imageUrlRef.current = url;
        setCustomImageUrl(url);
        setCustomTone(tone);
        applyCustomBgDocumentState(savedCustom, true, tone);
      } catch {
        if (!cancelled) {
          setCustomTone(null);
          applyCustomBgDocumentState({ ...savedCustom, enabled: false }, false, null);
        }
      }
    })();

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
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const offset = Math.max(-24, Math.min(24, window.scrollY * 0.04));
        document.documentElement.style.setProperty('--site-custom-bg-parallax', `${offset.toFixed(1)}px`);
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

    // Solid / Auto themes own the page look: deactivate custom wallpaper so swatches
    // take effect again. Keep the stored image so Custom can re-enable it later.
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
    setCustomSettings(next);
    if (!next.enabled) {
      clearCustomBgSettings();
      writeCustomBgSettings({ ...next, enabled: false });
      return;
    }
    writeCustomBgSettings(next);
  };

  const openCustomPanel = () => {
    setPanelOpen(true);
    setExpanded(true);
    setError(null);

    // Re-entering Custom with a stored image restores the wallpaper without re-upload.
    if (customImageUrl && !customSettings.enabled) {
      const enabled = { ...customSettings, enabled: true };
      setCustomSettings(enabled);
      writeCustomBgSettings(enabled);
      applyCustomBgDocumentState(enabled, true, customTone);
    }
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
    try {
      const blob = await compressImageFile(file);
      await saveCustomBgBlob(blob);
      const tone = toneFromLuminance(await estimateImageLuminance(blob));
      const url = URL.createObjectURL(blob);
      revokeObjectUrl(imageUrlRef.current);
      imageUrlRef.current = url;
      setCustomImageUrl(url);
      setCustomTone(tone);
      persistCustom({
        ...customSettings,
        enabled: true,
        mode: customSettings.mode === 'depth' && !isDesktopPointer ? 'cover' : customSettings.mode
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Upload failed';
      setError(isChinese
        ? (message.includes('large') ? '图片压缩后仍然过大，请换一张更小的图。' : '无法使用这张图片，请换 JPEG / PNG / WebP。')
        : (message.includes('large') ? 'Image is still too large after compression.' : 'Could not use that image. Try JPEG, PNG, or WebP.'));
    } finally {
      setBusy(false);
    }
  };

  const clearCustom = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteCustomBgBlob();
      revokeObjectUrl(imageUrlRef.current);
      imageUrlRef.current = null;
      setCustomImageUrl(null);
      setCustomTone(null);
      persistCustom({ ...DEFAULT_CUSTOM_BG_SETTINGS, enabled: false });
      setPanelOpen(false);
    } catch {
      setError(isChinese ? '清除失败，请重试。' : 'Could not clear the background.');
    } finally {
      setBusy(false);
    }
  };

  const customActive = Boolean(customSettings.enabled && customImageUrl);
  const layerStyle = {
    backgroundImage: customImageUrl ? `url("${customImageUrl}")` : 'none'
  } as CSSProperties;

  const copy = {
    custom: isChinese ? '自定义背景' : 'Custom background',
    upload: isChinese ? '上传图片' : 'Upload image',
    change: isChinese ? '更换图片' : 'Change image',
    clear: isChinese ? '清除自定义' : 'Clear custom',
    mode: isChinese ? '适配方式' : 'Fit mode',
    overlay: isChinese ? '遮罩强度' : 'Overlay strength',
    position: isChinese ? '焦点位置' : 'Focus position',
    hint: isChinese
      ? '仅保存在本机浏览器。'
      : 'Stored only in this browser.',
    depthNote: isChinese
      ? '固定景深受桌面指针设备支持；手机自动回退为铺满。'
      : 'Fixed depth is desktop-only; phones fall back to cover.',
    busy: isChinese ? '处理中…' : 'Working…'
  };

  return (
    <>
      <div
        aria-hidden="true"
        className={['site-custom-bg-layer', customActive ? 'is-active' : ''].filter(Boolean).join(' ')}
        style={layerStyle}
      />
      <div
        ref={rootRef}
        className={['site-palette-root', panelOpen ? 'is-panel-open' : ''].filter(Boolean).join(' ')}
      >
      <div
        aria-expanded={expanded || panelOpen}
        aria-label={isChinese ? '站点配色与背景' : 'Site color theme and background'}
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
        <div
          className="site-custom-bg-panel"
          id={panelId}
          role="region"
          aria-label={copy.custom}
        >
          <div className="site-custom-bg-panel-head">
            <p className="site-custom-bg-panel-title">{copy.custom}</p>
            <p className="site-custom-bg-panel-hint">{copy.hint}</p>
          </div>

          <div className="site-custom-bg-panel-row">
            <button
              className="site-custom-bg-action"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              {busy ? copy.busy : (customImageUrl ? copy.change : copy.upload)}
            </button>
            {customImageUrl ? (
              <button
                className="site-custom-bg-action site-custom-bg-action-muted"
                disabled={busy}
                onClick={() => void clearCustom()}
                type="button"
              >
                {copy.clear}
              </button>
            ) : null}
          </div>

          <input
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(event) => void onFileChange(event)}
            ref={fileInputRef}
            type="file"
          />

          {customImageUrl ? (
            <div
              aria-hidden="true"
              className="site-custom-bg-thumb"
              style={{ backgroundImage: `url("${customImageUrl}")` }}
            />
          ) : null}

          <label className="site-custom-bg-field">
            <span className="site-custom-bg-field-label">{copy.mode}</span>
            <select
              disabled={busy || !customImageUrl}
              onChange={(event) => {
                const nextMode = event.target.value as CustomBgMode;
                if (nextMode === 'depth' && !isDesktopPointer) {
                  persistCustom({ ...customSettings, enabled: true, mode: 'cover' });
                  return;
                }
                persistCustom({ ...customSettings, enabled: Boolean(customImageUrl), mode: nextMode });
              }}
              value={customSettings.mode}
            >
              {customBgModeOptions.map((option) => (
                <option
                  disabled={option.mode === 'depth' && !isDesktopPointer}
                  key={option.mode}
                  value={option.mode}
                >
                  {isChinese ? option.zh : option.en}
                </option>
              ))}
            </select>
            {customSettings.mode === 'depth' ? (
              <span className="site-custom-bg-panel-note">{copy.depthNote}</span>
            ) : null}
          </label>

          <label className="site-custom-bg-field">
            <span className="site-custom-bg-field-label">
              {copy.overlay}
              <span className="site-custom-bg-field-value">{customSettings.overlay}%</span>
            </span>
            <input
              disabled={busy || !customImageUrl}
              max={100}
              min={0}
              onChange={(event) => {
                persistCustom({
                  ...customSettings,
                  enabled: Boolean(customImageUrl),
                  overlay: Number(event.target.value)
                });
              }}
              type="range"
              value={customSettings.overlay}
            />
          </label>

          <label className="site-custom-bg-field">
            <span className="site-custom-bg-field-label">{copy.position}</span>
            <select
              disabled={busy || !customImageUrl || customSettings.mode === 'tile'}
              onChange={(event) => {
                persistCustom({
                  ...customSettings,
                  enabled: Boolean(customImageUrl),
                  position: event.target.value as CustomBgPosition
                });
              }}
              value={customSettings.position}
            >
              {customBgPositionOptions.map((option) => (
                <option key={option.position} value={option.position}>
                  {isChinese ? option.zh : option.en}
                </option>
              ))}
            </select>
          </label>

          {error ? <p className="site-custom-bg-error" role="alert">{error}</p> : null}
        </div>
      ) : null}
      </div>
    </>
  );
}
