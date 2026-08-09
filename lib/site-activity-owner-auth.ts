import crypto from 'node:crypto';

export const SITE_ACTIVITY_OWNER_PASSWORD_HASH_ENV = 'SITE_ACTIVITY_OWNER_PASSWORD_HASH';
export const SITE_ACTIVITY_OWNER_RATE_LIMIT = 5;
export const SITE_ACTIVITY_OWNER_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

const PASSWORD_HASH_PREFIX = 'scrypt:v1:';
const PASSWORD_HASH_PATTERN = /^scrypt:v1:([a-f0-9]{32}):([a-f0-9]{64})$/i;
const PASSWORD_SALT_BYTES = 16;
const PASSWORD_DERIVED_KEY_BYTES = 32;
const PASSWORD_SCRYPT_OPTIONS = {
  N: 16_384,
  r: 8,
  p: 1,
  maxmem: 32 * 1024 * 1024
};

type ParsedPasswordHash = {
  salt: Buffer;
  digest: Buffer;
};

export type SiteActivityOwnerRateLimitTransaction = {
  incr(key: string): unknown;
  expire(key: string, seconds: number): unknown;
  exec<T = unknown>(): Promise<T>;
};

export type SiteActivityOwnerRateLimitStore = {
  multi(): SiteActivityOwnerRateLimitTransaction;
};

export type SiteActivityOwnerRateLimitResult = {
  allowed: boolean;
  count: number;
  retryAfterSeconds: number;
};

function parsePasswordHash(value: string | undefined): ParsedPasswordHash | null {
  if (!value) return null;
  const match = PASSWORD_HASH_PATTERN.exec(value);
  if (!match) return null;
  return {
    salt: Buffer.from(match[1], 'hex'),
    digest: Buffer.from(match[2], 'hex')
  };
}

function passwordBytes(password: string) {
  return Buffer.byteLength(password, 'utf8');
}

function assertPassword(password: string) {
  if (typeof password !== 'string') throw new TypeError('password must be a string');
  const length = passwordBytes(password);
  if (length < 8 || length > 256) throw new RangeError('password length is outside the supported range');
}

function derivePasswordDigest(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      PASSWORD_DERIVED_KEY_BYTES,
      PASSWORD_SCRYPT_OPTIONS,
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(derivedKey);
      }
    );
  });
}

/** Create a deploy-time password hash without exposing the password or digest. */
export async function createSiteActivityOwnerPasswordHash(password: string, saltHex?: string) {
  assertPassword(password);
  const normalizedSalt = saltHex ?? crypto.randomBytes(PASSWORD_SALT_BYTES).toString('hex');
  if (!/^[a-f0-9]{32}$/i.test(normalizedSalt)) throw new TypeError('salt must be 16 bytes encoded as hex');
  const digest = await derivePasswordDigest(password, Buffer.from(normalizedSalt, 'hex'));
  return `${PASSWORD_HASH_PREFIX}${normalizedSalt}:${digest.toString('hex')}`;
}

/** Return false for a malformed envelope; let operational crypto failures reach the route as 503. */
export async function verifySiteActivityOwnerPassword(password: string, encodedHash: string | undefined) {
  if (typeof password !== 'string') return false;
  const parsed = parsePasswordHash(encodedHash);
  if (!parsed) return false;
  const derived = await derivePasswordDigest(password, parsed.salt);
  return crypto.timingSafeEqual(derived, parsed.digest);
}

export function isSiteActivityOwnerPasswordHash(value: string | undefined) {
  return parsePasswordHash(value) !== null;
}

/** Hash an IP-derived rate-limit identity without retaining the original address in Redis. */
export function siteActivityOwnerRateLimitKey(requestIp: string, secret: string, now = Date.now()) {
  const bucket = Math.floor(now / (SITE_ACTIVITY_OWNER_RATE_LIMIT_WINDOW_SECONDS * 1_000));
  const digest = crypto
    .createHmac('sha256', secret)
    .update(`site-activity-owner-rate:${requestIp}`)
    .digest('hex');
  return `xinbao-site-activity:owner-rate:v1:${bucket}:${digest}`;
}

export function siteActivityOwnerRateLimitRetryAfter(now = Date.now()) {
  const windowMs = SITE_ACTIVITY_OWNER_RATE_LIMIT_WINDOW_SECONDS * 1_000;
  return Math.max(1, Math.ceil((windowMs - (now % windowMs)) / 1_000));
}

/** Reserve one password attempt with an atomic Upstash INCR+EXPIRE transaction. */
export async function reserveSiteActivityOwnerRateLimit(
  store: SiteActivityOwnerRateLimitStore,
  key: string,
  now = Date.now()
): Promise<SiteActivityOwnerRateLimitResult> {
  const transaction = store.multi();
  transaction.incr(key);
  transaction.expire(key, SITE_ACTIVITY_OWNER_RATE_LIMIT_WINDOW_SECONDS);
  const result = await transaction.exec<unknown>();
  const countValue = Array.isArray(result) ? result[0] : result;
  const count = Number(countValue);
  if (!Number.isFinite(count)) throw new Error('owner rate-limit transaction returned an invalid count');
  return {
    allowed: count <= SITE_ACTIVITY_OWNER_RATE_LIMIT,
    count,
    retryAfterSeconds: siteActivityOwnerRateLimitRetryAfter(now)
  };
}
