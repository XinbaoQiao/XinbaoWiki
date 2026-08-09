export const SITE_ACTIVITY_SCHEMA_VERSION = 1 as const;
export const SITE_ACTIVITY_MAP_WIDTH = 672;
export const SITE_ACTIVITY_MAP_HEIGHT = 276;

export type SiteActivityLevel = 1 | 2 | 3;

export type SiteActivityCell = {
  level: SiteActivityLevel;
  x: number;
  y: number;
};

export type SiteActivityPayload = {
  cells: SiteActivityCell[];
  enabled: boolean;
  generatedAt: string;
  schemaVersion: typeof SITE_ACTIVITY_SCHEMA_VERSION;
  thresholds: {
    cell: number;
    total: number;
  };
  timezone: 'UTC';
  uniqueBrowsersEstimate: number | null;
  window: {
    completeDays: number;
    end: string;
    start: string;
  };
};

function isSiteActivityCell(value: unknown): value is SiteActivityCell {
  if (!value || typeof value !== 'object') return false;
  const cell = value as Partial<SiteActivityCell>;
  const x = cell.x;
  const y = cell.y;
  return (
    (cell.level === 1 || cell.level === 2 || cell.level === 3) &&
    typeof x === 'number' &&
    typeof y === 'number' &&
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 0 &&
    x <= SITE_ACTIVITY_MAP_WIDTH &&
    y >= 0 &&
    y <= SITE_ACTIVITY_MAP_HEIGHT
  );
}

export function parseSiteActivityPayload(value: unknown): SiteActivityPayload | null {
  if (!value || typeof value !== 'object') return null;
  const payload = value as Partial<SiteActivityPayload>;
  const window = payload.window;
  const thresholds = payload.thresholds;
  const uniqueBrowsersEstimate = payload.uniqueBrowsersEstimate;
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (
    payload.schemaVersion !== SITE_ACTIVITY_SCHEMA_VERSION ||
    typeof payload.enabled !== 'boolean' ||
    payload.timezone !== 'UTC' ||
    typeof payload.generatedAt !== 'string' ||
    !Number.isFinite(Date.parse(payload.generatedAt)) ||
    !window ||
    typeof window.start !== 'string' ||
    !isoDatePattern.test(window.start) ||
    typeof window.end !== 'string' ||
    !isoDatePattern.test(window.end) ||
    window.completeDays !== 30 ||
    !thresholds ||
    thresholds.cell !== 5 ||
    thresholds.total !== 10 ||
    !Array.isArray(payload.cells) ||
    payload.cells.length > 256 ||
    !payload.cells.every(isSiteActivityCell) ||
    !(
      uniqueBrowsersEstimate === null ||
      (
        Number.isInteger(uniqueBrowsersEstimate) &&
        (uniqueBrowsersEstimate ?? -1) >= thresholds.total &&
        (uniqueBrowsersEstimate ?? -1) % 5 === 0
      )
    ) ||
    (uniqueBrowsersEstimate === null && payload.cells.length > 0) ||
    (!payload.enabled && (uniqueBrowsersEstimate !== null || payload.cells.length > 0)) ||
    window.start > window.end
  ) {
    return null;
  }

  return payload as SiteActivityPayload;
}
