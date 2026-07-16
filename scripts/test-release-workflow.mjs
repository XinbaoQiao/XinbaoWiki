#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import http from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runExternal } from './lib/external-process.mjs';
import { stagedSmokeRoutes } from './lib/network-routes.mjs';
import { readReleaseState, writeReleaseState } from './lib/release-state.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
assert.equal(Number.parseInt(process.versions.node, 10), 22, 'release workflow tests execute under Node 22');

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: root,
      env: options.env || process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('exit', (status) => resolve({ status, stdout, stderr }));
  });
}

function json(res, value) {
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(value));
}

async function testSmokeRetry() {
  let homepageAttempts = 0;
  const server = http.createServer((req, res) => {
    if (req.url === '/') {
      homepageAttempts += 1;
      if (homepageAttempts === 1) {
        res.statusCode = 503;
        res.end('temporary failure');
        return;
      }
      res.end('Xinbaopedia');
      return;
    }
    if (req.url?.startsWith('/wiki/Xinbao_Qiao/')) {
      res.end('Xinbao wiki-page Portrait.png Portrait-Singapore-ICLR-2025.jpg Portrait-Seoul-ICML-2026.png Photograph taken at ICLR 2025, Singapore EXPO Photograph generated for ICML 2026, Seoul COEX');
      return;
    }
    if (req.url?.startsWith('/okf/manifest') || req.url?.startsWith('/okf/schema')) {
      json(res, { okfVersion: '0.1', schemaVersion: 1 });
      return;
    }
    if (req.url?.startsWith('/okf/graph')) {
      json(res, { okfVersion: '0.1', schemaVersion: 1, nodes: [], edges: [] });
      return;
    }
    if (req.url?.startsWith('/okf/quality-report')) {
      json(res, { okfVersion: '0.1', schemaVersion: 1, counts: { warnings: 0 }, hiddenPages: { pages: [] } });
      return;
    }
    res.statusCode = 404;
    res.end('not found');
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    const result = await run(process.execPath, ['scripts/smoke-production.mjs'], {
      env: {
        ...process.env,
        SITE_URL: `http://127.0.0.1:${port}`,
        SMOKE_RETRY_DELAY_MS: '1',
      },
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stderr, /Production smoke retry 2\/3/, 'smoke retries a transient HTTP status');
    assert.match(result.stdout, /Production smoke passed/, 'smoke passes after the retry succeeds');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function testExternalProcessTimeoutKillsTree() {
  const tempRoot = join(root, '.codex', 'tmp');
  mkdirSync(tempRoot, { recursive: true });
  const temp = mkdtempSync(join(tempRoot, 'process-timeout-test-'));
  const pidPath = join(temp, 'grandchild.pid');
  const script = [
    "const { spawn } = require('node:child_process');",
    "const { writeFileSync } = require('node:fs');",
    "const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });",
    "writeFileSync(process.argv[1], String(child.pid));",
    "setInterval(() => {}, 1000);",
  ].join('');

  try {
    const startedAt = Date.now();
    await assert.rejects(
      runExternal(process.execPath, ['-e', script, pidPath], {
        killGraceMs: 100,
        timeoutMs: 250,
      }),
      (error) => error.kind === 'timeout' && error.timeoutMs === 250
    );
    assert.ok(Date.now() - startedAt < 2_000, 'parent timeout bounds the full process tree');
    assert.ok(existsSync(pidPath), 'timeout fixture recorded its grandchild pid');
    const grandchildPid = Number.parseInt(readFileSync(pidPath, 'utf8'), 10);
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.throws(() => process.kill(grandchildPid, 0), /ESRCH/, 'timeout kills descendants, not only the direct child');
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

async function testExternalProcessOutputLimit() {
  await assert.rejects(
    runExternal(process.execPath, ['-e', "process.stdout.write('x'.repeat(4096))"], {
      maxOutputBytes: 1_024,
      timeoutMs: 2_000,
    }),
    (error) => error.kind === 'output_limit' && Buffer.byteLength(error.stdout) === 1_024
  );
}

function testNetworkRouteSelection() {
  const base = { PATH: process.env.PATH };
  assert.deepEqual(
    stagedSmokeRoutes(base, {}, 'auto').map((route) => route.name),
    ['direct'],
    'staged smoke uses direct access when no proxy is configured'
  );
  assert.deepEqual(
    stagedSmokeRoutes(base, { HTTPS_PROXY: 'http://127.0.0.1:17897' }, 'auto').map((route) => route.name),
    ['direct', 'proxy'],
    'staged smoke tries each distinct network route once'
  );
  assert.deepEqual(
    stagedSmokeRoutes(base, { HTTPS_PROXY: 'http://127.0.0.1:17897' }, 'proxy').map((route) => route.name),
    ['proxy'],
    'an explicit staged-smoke route is deterministic'
  );
}

function testReleaseStateRoundTrip() {
  const tempRoot = join(root, '.codex', 'tmp');
  mkdirSync(tempRoot, { recursive: true });
  const temp = mkdtempSync(join(tempRoot, 'release-state-test-'));
  const statePath = join(temp, 'release.json');
  try {
    writeReleaseState(statePath, {
      commit: 'abc123',
      deploymentUrl: 'https://example.vercel.app',
      lastSuccessfulPhase: 'staged',
      phase: 'failed',
    });
    const state = readReleaseState(statePath);
    assert.equal(state.schemaVersion, 1);
    assert.equal(state.commit, 'abc123');
    assert.equal(state.deploymentUrl, 'https://example.vercel.app');
    assert.match(state.updatedAt, /^\d{4}-\d{2}-\d{2}T/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

function testStagedControlFileGate() {
  for (const file of ['AGENTS.md', 'CLAUDE.md']) {
    const tempRoot = join(root, '.codex', 'tmp');
    mkdirSync(tempRoot, { recursive: true });
    const temp = mkdtempSync(join(tempRoot, 'release-test-'));
    const index = join(temp, 'index');
    const env = { ...process.env, GIT_INDEX_FILE: index };
    try {
      execFileSync('git', ['read-tree', 'HEAD'], { cwd: root, env, stdio: 'ignore' });
      const blob = execFileSync('git', ['hash-object', '-w', '--stdin'], {
        cwd: root,
        encoding: 'utf8',
        input: '# deliberately staged control-file test\n',
      }).trim();
      execFileSync('git', ['update-index', '--add', '--cacheinfo', `100644,${blob},${file}`], { cwd: root, env, stdio: 'ignore' });
      const result = execFileSync(process.execPath, ['scripts/verify-publish-set.mjs', '--staged-only'], {
        cwd: root,
        env,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      assert.fail(`control-file gate unexpectedly passed: ${result}`);
    } catch (error) {
      const output = `${error.stdout || ''}${error.stderr || ''}`;
      assert.match(output, new RegExp(`${file.replace('.', '\\.')}: blocked staged path`), `staged control-file gate rejects ${file}`);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  }
}

await testSmokeRetry();
await testExternalProcessTimeoutKillsTree();
await testExternalProcessOutputLimit();
testNetworkRouteSelection();
testReleaseStateRoundTrip();
testStagedControlFileGate();
console.log('Release workflow tests passed');
