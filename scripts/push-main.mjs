#!/usr/bin/env node

import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  authenticatedGithubRemote,
  githubRepositoryFromRemote,
  requireGithubPushPermission,
} from './lib/github-publish.mjs';
import { runExternal } from './lib/external-process.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const branch = 'main';
const args = process.argv.slice(2);
const checkOnly = args.includes('--check');

function fail(message) {
  console.error(`push-main: ${message}`);
  process.exit(1);
}

async function run(command, commandArgs, options = {}) {
  const result = await runExternal(command, commandArgs, {
    cwd: root,
    displayCommand: options.displayCommand || [command, ...commandArgs].join(' '),
    env: options.env || process.env,
    timeoutMs: options.timeoutMs || 60_000,
  });
  return result.stdout.trim();
}

async function githubJson(pathname, token) {
  const response = await fetch(`https://api.github.com${pathname}`, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'user-agent': 'xinbaopedia-publish-preflight',
      'x-github-api-version': '2022-11-28',
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`GitHub API preflight returned HTTP ${response.status}`);
  return response.json();
}

async function main() {
  if (args.includes('--help')) {
    console.log('Usage: GITHUB_TOKEN=... npm run push:check | GITHUB_TOKEN=... npm run push:main');
    return;
  }
  if (args.some((arg) => arg.startsWith('--token'))) {
    throw new Error('do not pass tokens on the command line; set GITHUB_TOKEN in the environment');
  }
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is required in the environment');

  const currentBranch = await run('git', ['branch', '--show-current']);
  if (currentBranch !== branch) throw new Error(`push must start from ${branch}; current branch is ${currentBranch || 'detached HEAD'}`);
  const staged = await run('git', ['diff', '--cached', '--name-only']);
  if (staged) throw new Error(`commit or unstage pending files before push: ${staged.split('\n').join(', ')}`);

  const origin = await run('git', ['remote', 'get-url', 'origin']);
  const { owner, repository } = githubRepositoryFromRemote(origin);
  const [user, repositoryPayload] = await Promise.all([
    githubJson('/user', token),
    githubJson(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`, token),
  ]);
  requireGithubPushPermission(repositoryPayload);
  const authenticatedRemote = authenticatedGithubRemote(origin, user.login);

  await run('git', ['fetch', '--no-tags', 'origin', branch], { timeoutMs: 60_000 });
  const head = await run('git', ['rev-parse', 'HEAD']);
  const remoteHead = await run('git', ['rev-parse', 'FETCH_HEAD']);
  try {
    await run('git', ['merge-base', '--is-ancestor', remoteHead, head]);
  } catch {
    throw new Error(`origin/${branch} is not an ancestor of local HEAD; resolve the divergence before pushing`);
  }

  console.log(`push-main: authenticated ${user.login}; origin/${branch} ${remoteHead.slice(0, 12)} can fast-forward to ${head.slice(0, 12)}`);
  if (checkOnly) {
    console.log('push-main: preflight passed; no remote write performed');
    return;
  }

  const temporaryRoot = join(root, '.codex', 'tmp');
  mkdirSync(temporaryRoot, { recursive: true });
  const temporaryDirectory = mkdtempSync(join(temporaryRoot, 'github-auth-'));
  const askpassPath = join(temporaryDirectory, 'askpass.sh');
  try {
    writeFileSync(askpassPath, '#!/bin/sh\nprintf \'%s\\n\' "$GITHUB_TOKEN"\n', { mode: 0o700 });
    chmodSync(askpassPath, 0o700);
    await run('git', ['push', authenticatedRemote, `${branch}:${branch}`], {
      displayCommand: `git push https://${user.login}@github.com/${owner}/${repository}.git ${branch}:${branch}`,
      env: {
        ...process.env,
        GIT_ASKPASS: askpassPath,
        GIT_TERMINAL_PROMPT: '0',
        GITHUB_TOKEN: token,
      },
      timeoutMs: 2 * 60_000,
    });
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }

  const publishedHead = (await run('git', ['ls-remote', '--exit-code', 'origin', `refs/heads/${branch}`], { timeoutMs: 60_000 })).split(/\s+/)[0];
  if (publishedHead !== head) throw new Error(`remote verification mismatch: expected ${head.slice(0, 12)}, got ${publishedHead.slice(0, 12)}`);
  await run('git', ['fetch', '--no-tags', 'origin', branch], { timeoutMs: 60_000 });
  const trackingHead = await run('git', ['rev-parse', `origin/${branch}`]);
  if (trackingHead !== head) throw new Error(`local tracking ref mismatch: expected ${head.slice(0, 12)}, got ${trackingHead.slice(0, 12)}`);
  console.log(`push-main: origin/${branch} verified at ${head}`);
}

main().catch((error) => fail(error.message));
