'use client';

import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
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
  if (!decodeURIComponent(pathname).split('/').includes('wiki')) return null;

  const slug = activeSlug(pathname);
  const isChinesePage = isChineseSlug(slug);
  const targetSlug = isChinesePage ? englishSlug(slug) : chineseSlug(slug);
  const href = `/wiki/${encodeURIComponent(targetSlug)}/`;

  return (
    <a className="lang-toggle" href={withBasePath(href)}>
      {isChinesePage ? 'English' : '中文'}
    </a>
  );
}

type SitePaletteName = 'text' | 'blue' | 'gold' | 'green' | 'charcoal';
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
  { color: '#36c', mode: 'auto', title: 'Auto theme by local time' },
  { color: '#202122', mode: 'text', title: 'Text wordmark theme' },
  { color: '#2b5f94', mode: 'blue', title: 'Morning blue theme' },
  { color: '#b8871b', mode: 'gold', title: 'Midday gold theme' },
  { color: '#2a7f62', mode: 'green', title: 'Evening green theme' },
  { color: '#2f3437', mode: 'charcoal', title: 'Night charcoal theme' }
];

function isSitePaletteMode(value: string | null): value is SitePaletteMode {
  return value === 'auto' || value === 'text' || value === 'blue' || value === 'gold' || value === 'green' || value === 'charcoal';
}

function sitePaletteForLocalTime(date = new Date()): Exclude<SitePaletteName, 'text'> {
  const hour = date.getHours();

  if (hour >= 5 && hour < 10) return 'blue';
  if (hour >= 10 && hour < 16) return 'gold';
  if (hour >= 16 && hour < 20) return 'green';
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

export function SitePalette({ icons }: SitePaletteProps) {
  const [mode, setMode] = useState<SitePaletteMode>('auto');

  useEffect(() => {
    const savedMode = window.localStorage.getItem(sitePaletteStorageKey);

    if (isSitePaletteMode(savedMode)) {
      setMode(savedMode);
    }
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

  const chooseMode = (nextMode: SitePaletteMode) => {
    setMode(nextMode);

    if (nextMode === 'auto') {
      window.localStorage.removeItem(sitePaletteStorageKey);
      return;
    }

    window.localStorage.setItem(sitePaletteStorageKey, nextMode);
  };

  return (
    <div className="site-palette-switcher" aria-label="Site color theme">
      {sitePaletteOptions.map((option) => {
        const pressed = mode === option.mode;
        const active = mode === option.mode;
        const style = { '--site-palette-swatch': option.color } as CSSProperties;

        return (
          <button
            aria-label={option.title}
            aria-pressed={pressed}
            className={['site-palette-button', active ? 'is-active' : '', option.mode === 'auto' ? 'site-palette-auto' : '', option.mode === 'text' ? 'site-palette-text' : '']
              .filter(Boolean)
              .join(' ')}
            key={option.mode}
            onClick={() => chooseMode(option.mode)}
            style={style}
            title={option.title}
            type="button"
          >
            <span className="sr-only">{option.title}</span>
          </button>
        );
      })}
    </div>
  );
}
