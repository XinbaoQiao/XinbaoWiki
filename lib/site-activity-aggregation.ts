import crypto from 'node:crypto';

export const SITE_ACTIVITY_CELL_THRESHOLD = 2;
export const SITE_ACTIVITY_TOTAL_THRESHOLD = 2;
export const SITE_ACTIVITY_MAX_CELLS = 512;
export const SITE_ACTIVITY_MIGRATION_MAX_CELLS = 1988;
export const SITE_ACTIVITY_KEY_PREFIX = 'xinbao-site-activity:v2';
export const SITE_ACTIVITY_LEGACY_KEY_PREFIX = 'xinbao-site-activity:v1';

const DAY_MS = 86_400_000;
const CELL_DEGREES = 5;
const LEGACY_RETENTION_DAYS = 33;
const MIGRATION_BATCH_SIZE = 128;
const MIGRATION_LOCK_SECONDS = 300;
const MIGRATION_RECHECK_SECONDS = 900;
const MIGRATION_RECHECK_MS = MIGRATION_RECHECK_SECONDS * 1000;

type MigrationReceipt = {
  complete: boolean;
  lastRun: string;
  passes: number;
  startedAt: string;
};

type MigrationPipeline = {
  exec<T extends unknown[]>(): Promise<T>;
  pfmerge(destination: string, source: string, ...sources: string[]): MigrationPipeline;
  sadd(key: string, member: string, ...members: string[]): MigrationPipeline;
  smembers(key: string): MigrationPipeline;
};

export type SiteActivityMigrationStore = {
  get<T = unknown>(key: string): Promise<T | null>;
  pipeline(): MigrationPipeline;
  set(
    key: string,
    value: string,
    options?: { ex?: number; nx?: true }
  ): Promise<unknown>;
};

function utcDateKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export function legacyDateKeys(since: string, now = new Date()) {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const launch = Date.parse(`${since}T00:00:00.000Z`);
  const first = Math.max(launch, today - (LEGACY_RETENTION_DAYS - 1) * DAY_MS);
  if (!Number.isFinite(launch) || first > today) return [];
  return Array.from({ length: Math.floor((today - first) / DAY_MS) + 1 }, (_, index) => (
    utcDateKey(new Date(first + index * DAY_MS))
  ));
}

export const siteActivityAggregationKeys = {
  legacyAll: (dateKey: string) => `${SITE_ACTIVITY_LEGACY_KEY_PREFIX}:day:${dateKey}:all`,
  legacyCell: (dateKey: string, cellId: string) => `${SITE_ACTIVITY_LEGACY_KEY_PREFIX}:day:${dateKey}:cell:${cellId}`,
  legacyCellsIndex: (dateKey: string) => `${SITE_ACTIVITY_LEGACY_KEY_PREFIX}:day:${dateKey}:cells`,
  lifetimeAll: () => `${SITE_ACTIVITY_KEY_PREFIX}:lifetime:all`,
  lifetimeCell: (cellId: string) => `${SITE_ACTIVITY_KEY_PREFIX}:lifetime:cell:${cellId}`,
  lifetimeCellsIndex: () => `${SITE_ACTIVITY_KEY_PREFIX}:lifetime:cells`,
  migrationLock: () => `${SITE_ACTIVITY_KEY_PREFIX}:migration:v1:lock`,
  migrationReceipt: () => `${SITE_ACTIVITY_KEY_PREFIX}:migration:v1:receipt`
};

export function publicSiteActivityEstimate(count: number) {
  return Number.isInteger(count) && count >= SITE_ACTIVITY_TOTAL_THRESHOLD ? count : null;
}

export function publicSiteActivityLevel(count: number): 1 | 2 | 3 | null {
  if (!Number.isInteger(count) || count < SITE_ACTIVITY_CELL_THRESHOLD) return null;
  return count >= 10 ? 3 : count >= 5 ? 2 : 1;
}

function parseReceipt(value: unknown): MigrationReceipt | null {
  if (typeof value !== 'string') return null;
  try {
    const receipt = JSON.parse(value) as Partial<MigrationReceipt>;
    if (
      typeof receipt.complete !== 'boolean' ||
      typeof receipt.lastRun !== 'string' ||
      !Number.isFinite(Date.parse(receipt.lastRun)) ||
      typeof receipt.startedAt !== 'string' ||
      !Number.isFinite(Date.parse(receipt.startedAt)) ||
      !Number.isInteger(receipt.passes) ||
      (receipt.passes ?? 0) < 1
    ) return null;
    return receipt as MigrationReceipt;
  } catch {
    return null;
  }
}

function migrationIsDue(receipt: MigrationReceipt | null, now: Date) {
  if (!receipt) return true;
  if (receipt.complete) return false;
  return now.getTime() - Date.parse(receipt.lastRun) >= MIGRATION_RECHECK_MS;
}

function cellSelectionScore(cellId: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(`site-activity-cell-selection:${cellId}`).digest('hex');
}

function isValidLegacyCellId(cellId: string) {
  const match = cellId.match(/^(-?\d+):(-?\d+)$/);
  if (!match) return false;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  return (
    Number.isInteger(latitude) &&
    Number.isInteger(longitude) &&
    latitude >= -55 &&
    latitude <= 80 &&
    longitude >= -175 &&
    longitude <= 175 &&
    latitude % CELL_DEGREES === 0 &&
    longitude % CELL_DEGREES === 0
  );
}

function chunked<T>(values: T[], size: number) {
  return Array.from({ length: Math.ceil(values.length / size) }, (_, index) => (
    values.slice(index * size, (index + 1) * size)
  ));
}

export async function migrateLegacySiteActivity(
  redis: SiteActivityMigrationStore,
  secret: string,
  since: string,
  now = new Date()
): Promise<'busy' | 'ready'> {
  let receipt = parseReceipt(await redis.get(siteActivityAggregationKeys.migrationReceipt()));
  if (!migrationIsDue(receipt, now)) return 'ready';

  const lockToken = crypto.randomUUID();
  const lockResult = await redis.set(
    siteActivityAggregationKeys.migrationLock(),
    lockToken,
    { ex: MIGRATION_LOCK_SECONDS, nx: true }
  );
  if (lockResult !== 'OK') return 'busy';

  receipt = parseReceipt(await redis.get(siteActivityAggregationKeys.migrationReceipt()));
  if (!migrationIsDue(receipt, now)) return 'ready';

  const dateKeys = legacyDateKeys(since, now);
  const indexPipeline = redis.pipeline();
  for (const dateKey of dateKeys) {
    indexPipeline.smembers(siteActivityAggregationKeys.legacyCellsIndex(dateKey));
  }
  const dailyCells = dateKeys.length > 0
    ? await indexPipeline.exec<string[][]>()
    : [];
  const cellIds = [...new Set(dailyCells.flat())]
    .filter(isValidLegacyCellId)
    .sort((left, right) => cellSelectionScore(left, secret).localeCompare(cellSelectionScore(right, secret)))
    .slice(0, SITE_ACTIVITY_MIGRATION_MAX_CELLS);

  if (dateKeys.length > 0) {
    const totalMigration = redis.pipeline();
    totalMigration.pfmerge(
      siteActivityAggregationKeys.lifetimeAll(),
      siteActivityAggregationKeys.lifetimeAll(),
      ...dateKeys.map(siteActivityAggregationKeys.legacyAll)
    );
    await totalMigration.exec();
  }

  for (const batch of chunked(cellIds, MIGRATION_BATCH_SIZE)) {
    const migration = redis.pipeline();
    for (const cellId of batch) {
      migration.pfmerge(
        siteActivityAggregationKeys.lifetimeCell(cellId),
        siteActivityAggregationKeys.lifetimeCell(cellId),
        ...dateKeys.map((dateKey) => siteActivityAggregationKeys.legacyCell(dateKey, cellId))
      );
    }
    const [firstCellId, ...remainingCellIds] = batch;
    if (firstCellId) {
      migration.sadd(
        siteActivityAggregationKeys.lifetimeCellsIndex(),
        firstCellId,
        ...remainingCellIds
      );
    }
    await migration.exec();
  }

  const nextPasses = (receipt?.passes ?? 0) + 1;
  const completedAt = now.toISOString();
  const nextReceipt: MigrationReceipt = {
    complete: nextPasses >= 3,
    lastRun: completedAt,
    passes: nextPasses,
    startedAt: receipt?.startedAt ?? completedAt
  };
  await redis.set(siteActivityAggregationKeys.migrationReceipt(), JSON.stringify(nextReceipt));
  return 'ready';
}
