import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export function readReleaseState(path) {
  if (!path || !existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function writeReleaseState(path, value) {
  if (!path) return;
  mkdirSync(dirname(path), { recursive: true });
  const next = {
    schemaVersion: 1,
    ...value,
    updatedAt: new Date().toISOString(),
  };
  const temporaryPath = `${path}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporaryPath, path);
}
