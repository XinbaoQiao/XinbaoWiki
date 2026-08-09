import crypto from 'node:crypto';

export const SITE_ACTIVITY_EXCLUSION_COOKIE_NAME = 'xinbao_site_activity_excluded';
export const SITE_ACTIVITY_VISITOR_COOKIE_NAME = 'xinbao_site_vid';
export const SITE_ACTIVITY_PREFERENCE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

const EXCLUSION_COOKIE_VERSION = 'v1';

function exclusionSignature(secret: string) {
  return crypto
    .createHmac('sha256', secret)
    .update('site-activity-browser-exclusion')
    .digest('hex')
    .slice(0, 32);
}

export function siteActivityExclusionCookieValue(secret: string) {
  return `${EXCLUSION_COOKIE_VERSION}.${exclusionSignature(secret)}`;
}

export function isSiteActivityBrowserExcluded(value: string | undefined, secret: string) {
  if (!value) return false;
  const parts = value.split('.');
  if (parts.length !== 2 || parts[0] !== EXCLUSION_COOKIE_VERSION || !/^[a-f0-9]{32}$/.test(parts[1])) {
    return false;
  }
  const expected = exclusionSignature(secret);
  return crypto.timingSafeEqual(Buffer.from(parts[1], 'hex'), Buffer.from(expected, 'hex'));
}
