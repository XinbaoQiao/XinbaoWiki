#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, rename, rm, stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const version = 'v22.23.1';
const platform = process.platform;
const architecture = process.arch;
const artifacts = {
  'linux-arm64': '0294e8b915ab75f92c7513d2fcb830ae06e10684e6c603e99a87dbf8835389c1',
  'linux-x64': '9749e988f437343b7fa832c69ded82a312e41a03116d766797ac14f6f9eee578',
};
const artifactKey = `${platform}-${architecture}`;
const expectedSha256 = artifacts[artifactKey];

if (!expectedSha256) {
  throw new Error(`bootstrap-node22: unsupported platform ${artifactKey}; use a Node 22 runtime manager on this system`);
}

const archiveName = `node-${version}-${artifactKey}.tar.xz`;
const toolsDir = join(root, '.tools');
const targetDir = join(toolsDir, 'node-v22');
const archivePath = join(toolsDir, 'downloads', archiveName);
const stagingDir = join(toolsDir, `.node-extract-${process.pid}`);
const extractedDir = join(stagingDir, `node-${version}-${artifactKey}`);
const nodeBin = join(targetDir, 'bin', 'node');

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function installedVersion() {
  try {
    return execFileSync(nodeBin, ['--version'], { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

async function sha256(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

async function download() {
  const url = `https://nodejs.org/dist/${version}/${archiveName}`;
  const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(120_000) });
  if (!response.ok || !response.body) {
    throw new Error(`bootstrap-node22: download failed with HTTP ${response.status} from ${url}`);
  }
  const partialPath = `${archivePath}.partial`;
  await rm(partialPath, { force: true });
  try {
    await pipeline(Readable.fromWeb(response.body), createWriteStream(partialPath));
    await rename(partialPath, archivePath);
  } finally {
    await rm(partialPath, { force: true });
  }
}

async function main() {
  if (installedVersion() === version) {
    console.log(`bootstrap-node22: ${version} is already installed at ${targetDir}`);
    return;
  }

  await mkdir(join(toolsDir, 'downloads'), { recursive: true });
  if (!await exists(archivePath) || await sha256(archivePath) !== expectedSha256) {
    await rm(archivePath, { force: true });
    console.log(`bootstrap-node22: downloading ${archiveName} directly from nodejs.org`);
    await download();
  }
  const actualSha256 = await sha256(archivePath);
  if (actualSha256 !== expectedSha256) {
    throw new Error(`bootstrap-node22: SHA-256 mismatch for ${archiveName}`);
  }

  await rm(stagingDir, { recursive: true, force: true });
  await mkdir(stagingDir, { recursive: true });
  try {
    execFileSync('tar', ['-xJf', archivePath, '-C', stagingDir], { stdio: 'inherit' });
    await rm(targetDir, { recursive: true, force: true });
    await rename(extractedDir, targetDir);
  } finally {
    await rm(stagingDir, { recursive: true, force: true });
  }

  if (installedVersion() !== version) {
    throw new Error(`bootstrap-node22: installed runtime did not report ${version}`);
  }
  console.log(`bootstrap-node22: installed and verified ${version} at ${targetDir}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
