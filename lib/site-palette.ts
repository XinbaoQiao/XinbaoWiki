import { CHARACTER_OCEAN_ACTIVE_STYLES, CHARACTER_OCEAN_MOBILE_MAX_WIDTH, CHARACTER_OCEAN_STORAGE_KEY, DEFAULT_CHARACTER_OCEAN } from '@/lib/site-character-ocean';

export type SitePaletteName = 'text' | 'blue' | 'gold' | 'rose' | 'green' | 'violet' | 'charcoal';
export type SitePaletteMode = SitePaletteName | 'auto';
export const sitePaletteStorageKey = 'mywiki-palette-mode';
const paletteModes: readonly SitePaletteMode[] = ['auto', 'text', 'blue', 'gold', 'rose', 'green', 'violet', 'charcoal'];

export function isSitePaletteMode(value: string | null): value is SitePaletteMode {
  return paletteModes.includes(value as SitePaletteMode);
}

// Self-contained so the head bootstrap can embed the same resolver.
export function sitePaletteForLocalTime(date = new Date()): Exclude<SitePaletteName, 'text'> {
  const hour = date.getHours();
  if (hour >= 5 && hour < 9) return 'blue';
  if (hour >= 9 && hour < 13) return 'gold';
  if (hour >= 13 && hour < 16) return 'rose';
  if (hour >= 16 && hour < 19) return 'green';
  if (hour >= 19 && hour < 22) return 'violet';
  return 'charcoal';
}

/** Restore visual-only preferences before the server-rendered body paints. */
export function siteAppearanceBootstrapScript(): string {
  const config = JSON.stringify({
    paletteKey: sitePaletteStorageKey, palettes: paletteModes,
    oceanKey: CHARACTER_OCEAN_STORAGE_KEY,
    oceanStyles: ['off', ...CHARACTER_OCEAN_ACTIVE_STYLES],
    oceanDefault: DEFAULT_CHARACTER_OCEAN.style,
    mobileMax: CHARACTER_OCEAN_MOBILE_MAX_WIDTH
  });
  return `(function(c,pick){var mode='auto',style=c.oceanDefault;try{var saved=localStorage.getItem(c.paletteKey);if(c.palettes.indexOf(saved)!==-1)mode=saved;}catch(e){}try{var raw=localStorage.getItem(c.oceanKey);if(raw){try{var parsed=JSON.parse(raw);style=parsed&&parsed.style;}catch(e){style=raw;}if(style==='dots')style='braille';if(style==='glyphs')style='hanzi';if(c.oceanStyles.indexOf(style)===-1)style=c.oceanDefault;}}catch(e){}if(window.matchMedia('(max-width: '+c.mobileMax+'px)').matches)style='off';var root=document.documentElement;root.dataset.sitePalette=mode==='auto'?pick():mode;root.dataset.sitePaletteMode=mode;root.dataset.siteCharacterOcean=style;root.dataset.siteBgCompose=style==='off'?'palette':'ocean';})(${config},${sitePaletteForLocalTime.toString()});`;
}
