#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import http from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
testStagedControlFileGate();
console.log('Release workflow tests passed');
