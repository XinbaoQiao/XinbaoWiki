import type { CharacterOceanLanguage } from '@/lib/site-character-ocean';
import type { CharacterOceanStyle } from '@/lib/site-character-ocean';

export type ActiveOceanStyle = Exclude<CharacterOceanStyle, 'off'>;

/** Density ramps: index 0 = sparse/water, last = densest/body. */
export type GlyphRamp = readonly string[];

/** Site-theme vocabulary (research / networks / learning / wiki). Letters stream
 *  along shark spines as coherent words — not a noise alphabet. */
const EN_WORDS = [
  'research',
  'network',
  'learning',
  'wiki',
  'lens',
  'question',
  'model',
  'search',
  'world',
  'human',
  'dataset',
  'atlas',
  'signal',
  'graph',
  'paper',
  'cite',
  'note',
  'ocean',
  'school',
  'curiosity',
  'knowledge',
  'inquiry',
  'theory',
  'system',
  'link',
  'node',
  'edge',
  'proof',
  'reason',
  'memory',
  'archive',
  'index',
  'source',
  'method',
  'field',
  'lab',
] as const;

/** Chinese theme vocabulary (ocean + research/wiki). Streams along shark spines. */
const ZH_WORDS = [
  '研究',
  '网络',
  '学习',
  '知识',
  '海洋',
  '鱼群',
  '提问',
  '模型',
  '世界',
  '证据',
  '图谱',
  '论文',
  '索引',
  '档案',
  '记忆',
  '方法',
  '系统',
  '链路',
  '信源',
  '学问',
  '浪潮',
  '海水',
  '鱼鲓',
] as const;

/** Joined stream with light separators so adjacent cells spell readable runs. */
export const EN_LETTER_STREAM = EN_WORDS.join('·');
export const ZH_LETTER_STREAM = ZH_WORDS.join('·');

const EN_ASCII: GlyphRamp = ['.', '·', ':', '-', '=', '+', '*', '%', '#', '@'];
const ZH_ASCII: GlyphRamp = ['\u00b7', '\u3001', '\u3002', '\u4e00', '\u4e8c', '\u5341', '\u6728', '\u6c34', '\u9b5a', '\u9b93'];

/** Type style: still theme-weighted letters (from vocabulary), denser ink. */
const EN_TYPE: GlyphRamp = Array.from(
  new Set(
    EN_WORDS.join('').toUpperCase().split('').filter((c) => /[A-Z]/.test(c)),
  ),
) as GlyphRamp;
const ZH_TYPE: GlyphRamp = Array.from(
  new Set(ZH_WORDS.join('').split('').filter((c) => c !== '·')),
) as GlyphRamp;

const BRAILLE: GlyphRamp = ['\u2800', '\u2801', '\u2802', '\u2804', '\u2808', '\u2810', '\u2820', '\u2803', '\u2806', '\u283f', '\u28ff'];

const BLOCKS: GlyphRamp = [' ', '\u2591', '\u2592', '\u2593', '\u2588'];

const GEO: GlyphRamp = ['\u00b7', '\u25cb', '\u25e6', '\u25cf', '\u25a1', '\u25a0', '\u25b3', '\u25b2', '\u25c7'];

const LINES: GlyphRamp = [' ', '\u2575', '\u2577', '\u2502', '\u2500', '\u251c', '\u2524', '\u253c', '\u254b'];

const EN_HANZI: GlyphRamp = ['\u00b7', '\u4e00', '\u5341', '\u5ddd', '\u5c71', '\u6c34', '\u6d77', '\u9b5a', '\u9b93'];
const ZH_HANZI: GlyphRamp = ['\u00b7', '\u4e00', '\u5341', '\u5ddd', '\u5c71', '\u6c34', '\u6d77', '\u9b5a', '\u9b93'];

/** Skin punctuation densifiers (fins / ridges / edges) — not body lettering. */
export const SKIN_RAMP = ':;t%SX8#@';
export const FIN_GLYPHS = '%;tS:';
export const RIDGE_GLYPHS = '@8%';
export const MARK_GLYPHS = '·:;.+';
export const EDGE_HEAVY = ':;';
export const EDGE_LIGHT = ".',`";

const CJK_FONT_STACK = '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", "Segoe UI", sans-serif';
const MONO_FONT_STACK = 'ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace';
const SYMBOL_MONO_STACK = 'ui-monospace, "Cascadia Mono", "Segoe UI Symbol", Menlo, Consolas, monospace';

export function glyphRampFor(style: ActiveOceanStyle, language: CharacterOceanLanguage): GlyphRamp {
  switch (style) {
    case 'ascii':
      return language === 'zh' ? ZH_ASCII : EN_ASCII;
    case 'type':
      return language === 'zh' ? (ZH_TYPE.length ? ZH_TYPE : ZH_ASCII) : EN_TYPE.length ? EN_TYPE : EN_ASCII;
    case 'braille':
      return BRAILLE;
    case 'blocks':
      return BLOCKS;
    case 'geometry':
      return GEO;
    case 'lines':
      return LINES;
    case 'hanzi':
      return language === 'zh' ? ZH_HANZI : EN_HANZI;
    default:
      return language === 'zh' ? ZH_ASCII : EN_ASCII;
  }
}

/**
 * Canvas font stack. When language is zh (or style is hanzi), CJK faces must
 * lead — Latin monospace alone drops Chinese glyphs as blank cells.
 */
export function fontFamilyFor(style: ActiveOceanStyle, language: CharacterOceanLanguage = 'en'): string {
  const needCjk = language === 'zh' || style === 'hanzi';
  if (style === 'hanzi') {
    return CJK_FONT_STACK;
  }
  if (style === 'braille' || style === 'blocks' || style === 'geometry' || style === 'lines') {
    return needCjk ? `${SYMBOL_MONO_STACK}, ${CJK_FONT_STACK}` : SYMBOL_MONO_STACK;
  }
  return needCjk ? `${CJK_FONT_STACK}, ${MONO_FONT_STACK}` : MONO_FONT_STACK;
}

export function pickGlyph(ramp: GlyphRamp, density: number, salt: number): string {
  if (ramp.length === 0) return ' ';
  const curved = Math.pow(Math.max(0, Math.min(1, density)), 0.58);
  const jitter = ((salt % 5) - 2) * 0.01;
  const t = Math.max(0, Math.min(0.999, curved + jitter));
  const idx = Math.max(0, Math.min(ramp.length - 1, Math.floor(t * ramp.length)));
  return ramp[idx] ?? ' ';
}

/** Dense bodies for school fish - never lone dots/dashes (those read as bugs). */
const EN_FISH_BODY = 'DQBRAGPHMWmwoO08';
/** ZH / hanzi body pool: fish + water theme. */
const ZH_FISH_BODY = '鱼鲓海水浪洋潮波';
/** Style-specific mid-body pools so every alphabet shows a visible body glyph. */
const BRAILLE_FISH_BODY = '⠿⣿⠓⠞⠸⠼⠧⢸⣸⣇';
const BLOCKS_FISH_BODY = '░▒▓█▇▆';
const GEO_FISH_BODY = '●■▲◆◇□△○';
const LINES_FISH_BODY = '━─┼╋┬┴├┤';

/** Parts of a compact school fish: tip frame + alphabet body. */
export type SchoolFishParts = { head: string; body: string; tail: string };

/**
 * Compact school-fish silhouette from the active alphabet.
 * Always head + body + tail so mid-size reads as a tiny fish,
 * not a mosquito dash / caret swarm. Direction follows vx only.
 *
 * Every style gets a meaningful mid-body glyph from its own alphabet
 * (EN letters, ZH Hanzi, braille cells, blocks, geometry, lines).
 * Tips stay ASCII/symbol frames; body is never a blank / punctuation-only mid.
 */
export function schoolFishParts(
  style: ActiveOceanStyle,
  language: CharacterOceanLanguage,
  vx: number,
  salt: number,
): SchoolFishParts {
  const right = vx >= 0;
  const tipHead = right ? '>' : '<';
  const tipTail = right ? '>' : '<';
  const roll = (salt >>> 2) % 6;

  const tipPair = (): { head: string; tail: string } => {
    if (roll === 1) return right ? { head: '>', tail: '=' } : { head: '=', tail: '<' };
    if (roll === 2) return right ? { head: '>', tail: '*' } : { head: '*', tail: '<' };
    if (roll === 3) return right ? { head: '>', tail: '~' } : { head: '~', tail: '<' };
    return { head: tipHead, tail: tipTail };
  };

  if (style === 'braille') {
    const body = BRAILLE_FISH_BODY[salt % BRAILLE_FISH_BODY.length]!;
    return right
      ? { head: '⣿', body, tail: '⠇' }
      : { head: '⣠', body, tail: '⣿' };
  }
  if (style === 'blocks') {
    const body = BLOCKS_FISH_BODY[salt % BLOCKS_FISH_BODY.length]!;
    return right
      ? { head: '█', body, tail: '▶' }
      : { head: '◀', body, tail: '█' };
  }
  if (style === 'geometry') {
    const body = GEO_FISH_BODY[salt % GEO_FISH_BODY.length]!;
    return right
      ? { head: '●', body, tail: '▶' }
      : { head: '◀', body, tail: '●' };
  }
  if (style === 'lines') {
    const body = LINES_FISH_BODY[salt % LINES_FISH_BODY.length]!;
    return right
      ? { head: '━', body, tail: '▶' }
      : { head: '◀', body, tail: '━' };
  }

  if (style === 'hanzi' || (language === 'zh' && (style === 'ascii' || style === 'type'))) {
    const body = ZH_FISH_BODY[salt % ZH_FISH_BODY.length]!;
    const tips = tipPair();
    return { head: tips.head, body, tail: tips.tail };
  }

  // EN ascii / type -- body always dense letter/glyph (never punctuation-only mid).
  let body = EN_FISH_BODY[salt % EN_FISH_BODY.length]!;
  if (style === 'type') {
    body = body.toUpperCase();
  }
  if (/^[*=~<>.:-]$/.test(body)) {
    body = EN_FISH_BODY[(salt * 7 + 3) % EN_FISH_BODY.length]!;
  }
  const tips = tipPair();
  return { head: tips.head, body, tail: tips.tail };
}

export function schoolFishSilhouette(
  style: ActiveOceanStyle,
  language: CharacterOceanLanguage,
  vx: number,
  salt: number,
): string {
  const p = schoolFishParts(style, language, vx, salt);
  return `${p.head}${p.body}${p.tail}`;
}
export function enStreamGlyph(sAlong: number, salt: number, density: number): string {
  // Sparse rim: heavy punctuation so the outline still reads as a shark edge.
  if (density < 0.22) {
    return EDGE_HEAVY[(salt >>> 3) % EDGE_HEAVY.length]!;
  }
  if (density < 0.36) {
    return EN_ASCII[Math.min(EN_ASCII.length - 1, Math.floor(density * 10 + 2))]!;
  }
  const stream = EN_LETTER_STREAM;
  const idx =
    (Math.floor(sAlong * stream.length * 2.4) + (salt % 5) + Math.floor(salt / 97)) %
    stream.length;
  let ch = stream[idx] ?? '#';
  if (ch === '·') {
    // Separators become ink marks so the body does not go hollow.
    return density > 0.55 ? '#' : '%';
  }
  // Prefer uppercase / dense ink across most of the body so the silhouette holds.
  if (density > 0.48) ch = ch.toUpperCase();
  return ch;
}

/** Chinese body glyph: walk ZH theme stream along the spine (mirror of enStreamGlyph). */
export function zhStreamGlyph(sAlong: number, salt: number, density: number): string {
  if (density < 0.22) {
    return EDGE_HEAVY[(salt >>> 3) % EDGE_HEAVY.length]!;
  }
  if (density < 0.36) {
    return ZH_ASCII[Math.min(ZH_ASCII.length - 1, Math.floor(density * 10 + 2))]!;
  }
  const stream = ZH_LETTER_STREAM;
  const idx =
    (Math.floor(sAlong * stream.length * 2.4) + (salt % 5) + Math.floor(salt / 97)) %
    stream.length;
  const ch = stream[idx] ?? '鱼';
  if (ch === '·') {
    return density > 0.55 ? '海' : '水';
  }
  return ch;
}
