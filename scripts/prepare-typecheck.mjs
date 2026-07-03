#!/usr/bin/env node

import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const nextTypes = join(root, '.next', 'types');
const tsBuildInfo = join(root, 'tsconfig.tsbuildinfo');

if (!existsSync(nextTypes) && existsSync(tsBuildInfo)) {
  rmSync(tsBuildInfo, { force: true });
  console.log('prepare-typecheck: removed stale tsconfig.tsbuildinfo because .next/types is missing');
}
