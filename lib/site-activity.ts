export const SITE_ACTIVITY_SCHEMA_VERSION = 2 as const;
export const SITE_ACTIVITY_API_PATH = `/api/site-activity/v${SITE_ACTIVITY_SCHEMA_VERSION}/` as const;
export const SITE_ACTIVITY_MAP_WIDTH = 672;
export const SITE_ACTIVITY_MAP_HEIGHT = 276;
export const SITE_ACTIVITY_SINCE = '2026-08-09';
export const SITE_ACTIVITY_CANONICAL_HOSTNAME = 'xinbaopedia.top';

const SITE_ACTIVITY_AUTOMATION_USER_AGENT = /(?:HeadlessChrome\/|Playwright|Puppeteer|xinbaopedia-)/i;
const SITE_ACTIVITY_LOOPBACK_HOSTNAMES = new Set(['127.0.0.1', '::1', '[::1]', 'localhost']);

type SiteActivityRequestSource = {
  hostname: string;
  testMode?: boolean;
  userAgent?: string | null;
};

export function shouldRecordSiteActivityRequest({
  hostname,
  testMode = false,
  userAgent = null
}: SiteActivityRequestSource) {
  const normalizedHostname = hostname.trim().toLowerCase().replace(/\.$/, '');
  if (testMode && SITE_ACTIVITY_LOOPBACK_HOSTNAMES.has(normalizedHostname)) return true;
  return (
    normalizedHostname === SITE_ACTIVITY_CANONICAL_HOSTNAME &&
    !SITE_ACTIVITY_AUTOMATION_USER_AGENT.test(userAgent ?? '')
  );
}

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
  period: {
    scope: 'lifetime';
    since: string;
  };
  uniqueBrowsersEstimate: number | null;
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
  const period = payload.period;
  const thresholds = payload.thresholds;
  const uniqueBrowsersEstimate = payload.uniqueBrowsersEstimate;
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (
    payload.schemaVersion !== SITE_ACTIVITY_SCHEMA_VERSION ||
    typeof payload.enabled !== 'boolean' ||
    typeof payload.generatedAt !== 'string' ||
    !Number.isFinite(Date.parse(payload.generatedAt)) ||
    !period ||
    period.scope !== 'lifetime' ||
    typeof period.since !== 'string' ||
    !isoDatePattern.test(period.since) ||
    period.since !== SITE_ACTIVITY_SINCE ||
    !thresholds ||
    thresholds.cell !== 2 ||
    thresholds.total !== 2 ||
    !Array.isArray(payload.cells) ||
    payload.cells.length > 512 ||
    !payload.cells.every(isSiteActivityCell) ||
    !(
      uniqueBrowsersEstimate === null ||
      (
        Number.isInteger(uniqueBrowsersEstimate) &&
        (uniqueBrowsersEstimate ?? -1) >= thresholds.total
      )
    ) ||
    (uniqueBrowsersEstimate === null && payload.cells.length > 0) ||
    (!payload.enabled && (uniqueBrowsersEstimate !== null || payload.cells.length > 0))
  ) {
    return null;
  }

  return payload as SiteActivityPayload;
}
