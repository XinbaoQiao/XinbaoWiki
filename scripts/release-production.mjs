#!/usr/bin/env node

import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runExternal } from './lib/external-process.mjs';
import {
  readReleaseState,
  validateProductionVerifiedRelease,
} from './lib/release-state.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const branch = 'main';
const productionUrl = 'https://xinbaopedia.top';
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const resume = args.includes('--resume');

function fail(message) {
  console.error(`release-production: ${message}`);
  process.exit(1);
}

async function run(command, commandArgs, options = {}) {
  const result = await runExternal(command, commandArgs, {
    capture: options.capture !== false,
    cwd: options.cwd || root,
    displayCommand: [command, ...commandArgs].join(' '),
    env: options.env || process.env,
    mirrorStderr: options.capture !== false,
    timeoutMs: options.timeoutMs || 60_000,
  });
  return result.stdout;
}

function git(commandArgs, options = {}) {
  return run('git', commandArgs, options);
}

function requireDeclaredRuntime() {
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const expectedMajor = Number.parseInt(packageJson.engines?.node, 10);
  const actualMajor = Number.parseInt(process.versions.node, 10);
  if (Number.isInteger(expectedMajor) && actualMajor !== expectedMajor) {
    fail(`Node ${process.versions.node} is active but the project requires ${packageJson.engines.node}; use npm run release:production so the project Node 22 runtime is selected`);
  }
}

async function main() {
  requireDeclaredRuntime();
  const currentBranch = (await git(['branch', '--show-current'])).trim();
  if (currentBranch !== branch) {
    fail(`production releases must start from ${branch}; current branch is ${currentBranch || 'detached HEAD'}`);
  }

  const staged = (await git(['diff', '--cached', '--name-only'])).trim();
  if (staged) {
    fail(`commit or unstage pending files before release: ${staged.split('\n').join(', ')}`);
  }

  const head = (await git(['rev-parse', 'HEAD'])).trim();
  const remoteOutput = (await git(
    ['ls-remote', '--exit-code', 'origin', `refs/heads/${branch}`],
    { timeoutMs: 60_000 }
  )).trim();
  const remoteHead = remoteOutput.split(/\s+/)[0];
  if (head !== remoteHead) {
    fail(`local ${head.slice(0, 12)} does not match origin/${branch} ${remoteHead.slice(0, 12)}; push the intended commit first`);
  }

  const dirty = (await git(['status', '--porcelain'])).trim();
  if (dirty) {
    console.log('release-production: local working-tree changes are excluded; deploying the pushed HEAD commit in an isolated worktree');
  }

  const worktree = join(root, '.codex', 'tmp', 'release-worktrees', `${head.slice(0, 12)}-${process.pid}`);
  const statePath = join(root, '.codex', 'tmp', 'release-state', `${head}.json`);
  mkdirSync(dirname(worktree), { recursive: true });
  let registered = false;
  try {
    await git(['worktree', 'add', '--detach', worktree, head], {
      capture: false,
      timeoutMs: 60_000,
    });
    registered = true;
    await run('npm', ['run', 'verify:publish'], {
      capture: false,
      cwd: worktree,
      timeoutMs: 2 * 60_000,
    });
    if (dryRun) {
      console.log(`release-production: dry run passed for remote commit ${head}`);
    } else {
      const deployArgs = ['run', 'deploy:production'];
      if (resume) deployArgs.push('--', '--resume');
      await run('npm', deployArgs, {
        capture: false,
        cwd: worktree,
        env: {
          ...process.env,
          RELEASE_COMMIT: head,
          RELEASE_STATE_PATH: statePath,
        },
        timeoutMs: 25 * 60_000,
      });
      validateProductionVerifiedRelease(readReleaseState(statePath), {
        commit: head,
        productionUrl,
      });
      console.log(`release-production: deployed and verified ${head}`);
    }
  } finally {
    if (registered) {
      try {
        await git(['worktree', 'remove', '--force', worktree], {
          capture: false,
          timeoutMs: 60_000,
        });
      } catch (error) {
        console.warn(`release-production: automatic worktree cleanup failed: ${error.message}`);
      }
    }
    rmSync(worktree, { recursive: true, force: true });
    await git(['worktree', 'prune']);
  }
}

main().catch((error) => {
  fail(error.stderr?.trim() || error.message);
});
