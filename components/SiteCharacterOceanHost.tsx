"use client";

import { useEffect, useState } from 'react';
import { SiteCharacterOcean } from '@/components/SiteCharacterOcean';
import {
  CHARACTER_OCEAN_STORAGE_KEY,
  DEFAULT_CHARACTER_OCEAN,
  characterOceanMobileMediaQuery,
  normalizeCharacterOceanStyle,
  parseCharacterOceanSettings,
  type CharacterOceanLanguage,
  type CharacterOceanSettings,
} from '@/lib/site-character-ocean';
import type { ActiveOceanStyle } from '@/lib/character-ocean/alphabets';

function readLanguage(): CharacterOceanLanguage {
  if (typeof document === 'undefined') return 'en';
  const lang = document.documentElement.getAttribute('lang') || 'en';
  return lang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function readSettings(): CharacterOceanSettings {
  if (typeof document === 'undefined') return { ...DEFAULT_CHARACTER_OCEAN };
  try {
    const raw = window.localStorage.getItem(CHARACTER_OCEAN_STORAGE_KEY);
    if (raw) return parseCharacterOceanSettings(raw);
  } catch {
    /* ignore */
  }
  const fromDom = document.documentElement.dataset.siteCharacterOcean;
  const densityRaw = document.documentElement.dataset.siteOceanDensity;
  const opacityRaw = document.documentElement.dataset.siteOceanOpacity;
  const kindsRaw = document.documentElement.dataset.siteOceanKinds;
  let kindsParsed: unknown = undefined;
  if (kindsRaw) {
    try {
      kindsParsed = JSON.parse(kindsRaw);
    } catch {
      kindsParsed = undefined;
    }
  }
  const base = parseCharacterOceanSettings(
    fromDom
      ? JSON.stringify({
          style: fromDom,
          density: Number(densityRaw),
          opacity: Number(opacityRaw),
          kinds: kindsParsed,
        })
      : null,
  );
  if (fromDom) base.style = normalizeCharacterOceanStyle(fromDom);
  return base;
}

function isDevPreviewPath(): boolean {
  if (typeof window === 'undefined') return false;
  return /\/dev\/character-ocean\/?$/.test(window.location.pathname);
}

export function SiteCharacterOceanHost() {
  const [settings, setSettings] = useState<CharacterOceanSettings>({ ...DEFAULT_CHARACTER_OCEAN, kinds: [...DEFAULT_CHARACTER_OCEAN.kinds] });
  const [language, setLanguage] = useState<CharacterOceanLanguage>('en');
  const [ready, setReady] = useState(false);
  const [solidDemo, setSolidDemo] = useState(false);
  /** Temporarily disable ocean on small screens (CPU/battery + cramped UI). */
  const [mobileOff, setMobileOff] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia(characterOceanMobileMediaQuery());
    const syncMobile = () => setMobileOff(mq.matches);
    syncMobile();
    mq.addEventListener('change', syncMobile);

    setSettings(readSettings());
    setLanguage(readLanguage());
    setSolidDemo(isDevPreviewPath());
    setReady(true);

    const mo = new MutationObserver(() => {
      setSettings(readSettings());
      setLanguage(readLanguage());
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [
        'data-site-character-ocean',
        'data-site-ocean-density',
        'data-site-ocean-opacity',
        'data-site-ocean-kinds',
        'lang',
        'data-language',
      ],
    });

    const onStorage = (e: StorageEvent) => {
      if (e.key === CHARACTER_OCEAN_STORAGE_KEY) setSettings(readSettings());
    };
    window.addEventListener('storage', onStorage);
    return () => {
      mq.removeEventListener('change', syncMobile);
      mo.disconnect();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  if (!ready) return null;
  // Temporarily no fish on small viewports (CPU/battery + cramped UI).
  if (mobileOff) return null;
  if (settings.style === 'off') return null;

  return (
    <SiteCharacterOcean
      style={settings.style as ActiveOceanStyle}
      language={language}
      wash={!solidDemo}
      density={settings.density}
      opacity={settings.opacity}
      kinds={settings.kinds}
    />
  );
}
