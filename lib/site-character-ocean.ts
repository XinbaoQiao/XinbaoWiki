/**
 * Site character-ocean settings.
 * Visual UX aligned with jiezi1234/character-ocean (MIT UI concepts).
 * Animation/renderer is an original your-wiki implementation — does not
 * vendor stackedlol/ascii-sharks or character-ocean engine sources (no
 * upstream license for those files; see character-ocean LICENSE.md).
 */

export type CharacterOceanStyle =
  | 'off'
  | 'ascii'
  | 'type'
  | 'braille'
  | 'blocks'
  | 'geometry'
  | 'lines'
  | 'hanzi';

export type CharacterOceanLanguage = 'en' | 'zh';

/** Silhouette cast — mirrors lib/character-ocean/world SharkKind. */
export type OceanSharkKind =
  | 'classic'
  | 'hammerhead'
  | 'tiger'
  | 'zebra'
  | 'greathammer'
  | 'mako'
  | 'thresher'
  | 'nurse'
  | 'manta'
  | 'whaleshark'
  | 'sunfish';

export const OCEAN_SHARK_KINDS: readonly OceanSharkKind[] = [
  'classic',
  'hammerhead',
  'tiger',
  'zebra',
  'greathammer',
  'mako',
  'thresher',
  'nurse',
  'manta',
  'whaleshark',
  'sunfish',
] as const;

export const DEFAULT_OCEAN_SHARK_KINDS: readonly OceanSharkKind[] = [
  'classic',
  'tiger',
  'hammerhead',
  'manta',
  'mako',
  'thresher',
] as const;

export function isOceanSharkKind(value: string | null | undefined): value is OceanSharkKind {
  return typeof value === 'string' && (OCEAN_SHARK_KINDS as readonly string[]).includes(value);
}

export function normalizeOceanSharkKinds(raw: unknown): OceanSharkKind[] {
  if (!Array.isArray(raw)) return [...DEFAULT_OCEAN_SHARK_KINDS];
  const seen = new Set<OceanSharkKind>();
  const out: OceanSharkKind[] = [];
  for (const item of raw) {
    if (isOceanSharkKind(item) && !seen.has(item)) {
      seen.add(item);
      out.push(item);
    }
  }
  return out.length ? out : [...DEFAULT_OCEAN_SHARK_KINDS];
}

export type CharacterOceanSettings = {
  style: CharacterOceanStyle;
  /** Field richness: school count, shark cast size, and glyph cell pitch (0.35–2). */
  density: number;
  /** Field opacity (0.2–1). */
  opacity: number;
  /** Allowed silhouette species (multi-select). */
  kinds: OceanSharkKind[];
};

/** Match engine + globals.css ocean mobile band (max-width: 720px). */
export const CHARACTER_OCEAN_MOBILE_MAX_WIDTH = 720;

/** True on small viewports where character-ocean is temporarily disabled. */
export function isCharacterOceanMobileViewport(
  width: number = typeof window !== 'undefined' ? window.innerWidth : CHARACTER_OCEAN_MOBILE_MAX_WIDTH + 1,
): boolean {
  return width <= CHARACTER_OCEAN_MOBILE_MAX_WIDTH;
}

export function characterOceanMobileMediaQuery(): string {
  return `(max-width: ${CHARACTER_OCEAN_MOBILE_MAX_WIDTH}px)`;
}

export const CHARACTER_OCEAN_STORAGE_KEY = 'mywiki-character-ocean';
export const DEFAULT_CHARACTER_OCEAN: CharacterOceanSettings = {
  style: 'ascii',
  density: 1,
  opacity: 0.92,
  kinds: [...DEFAULT_OCEAN_SHARK_KINDS],
};

export function clampOceanDensity(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_CHARACTER_OCEAN.density;
  return Math.min(2, Math.max(0.35, Math.round(value * 100) / 100));
}

export function clampOceanOpacity(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_CHARACTER_OCEAN.opacity;
  return Math.min(1, Math.max(0.2, Math.round(value * 100) / 100));
}

export const CHARACTER_OCEAN_STYLES: readonly CharacterOceanStyle[] = [
  'off',
  'ascii',
  'type',
  'braille',
  'blocks',
  'geometry',
  'lines',
  'hanzi'
];

export const CHARACTER_OCEAN_ACTIVE_STYLES: readonly Exclude<CharacterOceanStyle, 'off'>[] = [
  'ascii',
  'type',
  'braille',
  'blocks',
  'geometry',
  'lines',
  'hanzi'
];

export function isCharacterOceanStyle(value: string | null | undefined): value is CharacterOceanStyle {
  return (
    value === 'off' ||
    value === 'ascii' ||
    value === 'type' ||
    value === 'braille' ||
    value === 'blocks' ||
    value === 'geometry' ||
    value === 'lines' ||
    value === 'hanzi' ||
    /* legacy soft-field labels from earlier WIP */
    value === 'dots' ||
    value === 'glyphs'
  );
}

export function normalizeCharacterOceanStyle(value: string | null | undefined): CharacterOceanStyle {
  if (value === 'dots') return 'braille';
  if (value === 'glyphs' || value === 'lines') {
    if (value === 'glyphs') return 'hanzi';
    return 'lines';
  }
  if (
    value === 'off' ||
    value === 'ascii' ||
    value === 'type' ||
    value === 'braille' ||
    value === 'blocks' ||
    value === 'geometry' ||
    value === 'lines' ||
    value === 'hanzi'
  ) {
    return value;
  }
  return 'ascii';
}

export function parseCharacterOceanStyle(raw: string | null | undefined): CharacterOceanStyle {
  return normalizeCharacterOceanStyle(raw);
}

export function parseCharacterOceanSettings(raw: string | null): CharacterOceanSettings {
  if (!raw) return { ...DEFAULT_CHARACTER_OCEAN, kinds: [...DEFAULT_CHARACTER_OCEAN.kinds] };
  try {
    const parsed = JSON.parse(raw) as {
      style?: string;
      density?: number;
      opacity?: number;
      kinds?: unknown;
    };
    if (isCharacterOceanStyle(parsed.style)) {
      return {
        style: normalizeCharacterOceanStyle(parsed.style),
        density: clampOceanDensity(typeof parsed.density === 'number' ? parsed.density : DEFAULT_CHARACTER_OCEAN.density),
        opacity: clampOceanOpacity(typeof parsed.opacity === 'number' ? parsed.opacity : DEFAULT_CHARACTER_OCEAN.opacity),
        kinds: normalizeOceanSharkKinds(parsed.kinds),
      };
    }
  } catch {
    if (isCharacterOceanStyle(raw)) {
      return {
        style: normalizeCharacterOceanStyle(raw),
        density: DEFAULT_CHARACTER_OCEAN.density,
        opacity: DEFAULT_CHARACTER_OCEAN.opacity,
        kinds: [...DEFAULT_CHARACTER_OCEAN.kinds],
      };
    }
  }
  return { ...DEFAULT_CHARACTER_OCEAN, kinds: [...DEFAULT_CHARACTER_OCEAN.kinds] };
}

/** Compose mode with wallpaper: palette | ocean | wallpaper | wallpaper-ocean */
export function siteBackgroundComposeMode(opts: {
  oceanOn: boolean;
  wallpaperOn: boolean;
}): 'palette' | 'ocean' | 'wallpaper' | 'wallpaper-ocean' {
  if (opts.wallpaperOn && opts.oceanOn) return 'wallpaper-ocean';
  if (opts.wallpaperOn) return 'wallpaper';
  if (opts.oceanOn) return 'ocean';
  return 'palette';
}

export const characterOceanLabels = {
  en: {
    group: 'Character ocean',
    off: 'Off',
    ascii: 'ASCII',
    type: 'TYPE',
    braille: 'DOTS',
    blocks: 'BLOCK',
    geometry: 'GEO',
    lines: 'LINES',
    hanzi: 'HANZI',
    hint: 'Full-page character ocean behind the site. Tracks English/Chinese UI. Works with palette and wallpaper.',
    enable: 'Enable ocean',
    density: 'Density',
    opacity: 'Opacity',
    style: 'Style',
    kinds: 'Fish kinds',
    kindsHint: 'Pick which silhouettes swim. At least one stays on.',
    kindsAll: 'All',
    kindsDefault: 'Default six',
    classic: 'Classic',
    hammerhead: 'Hammerhead',
    tiger: 'Tiger',
    zebra: 'Zebra',
    greathammer: 'Great hammer',
    mako: 'Mako',
    thresher: 'Thresher',
    nurse: 'Nurse',
    manta: 'Manta',
    whaleshark: 'Whale shark',
    sunfish: 'Sunfish'
  },
  zh: {
    group: '字符海洋',
    off: '关闭',
    ascii: 'ASCII',
    type: '纯字',
    braille: '点阵',
    blocks: '方块',
    geometry: '几何',
    lines: '线条',
    hanzi: '汉字',
    hint: '全站铺满的字符海洋背景。随中/英界面切换字符集；可与配色、壁纸叠用。',
    enable: '开启海洋',
    density: '密度',
    opacity: '透明度',
    style: '样式',
    kinds: '鱼种',
    kindsHint: '多选会出现的剪影；至少保留一种。',
    kindsAll: '全选',
    kindsDefault: '默认六种',
    classic: '普通鲨',
    hammerhead: '锤头鲨',
    tiger: '虎鲨',
    zebra: '斑马鲨',
    greathammer: '巨锤头',
    mako: '灰鲭鲨',
    thresher: '长尾鲨',
    nurse: '护士鲨',
    manta: '蝠鲼',
    whaleshark: '鲸鲨',
    sunfish: '翻车鱼'
  }
} as const;
