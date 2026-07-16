#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const branch = 'main';
const dryRun = process.argv.includes('--dry-run');

function fail(message) {
  console.error(`release-production: ${message}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd || root,
    env: process.env,
    encoding: options.encoding || 'utf8',
    stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
  });
}

function git(args, options = {}) {
  return run('git', args, options);
}

function main() {
  const currentBranch = git(['branch', '--show-current']).trim();
  if (currentBranch !== branch) {
    fail(`production releases must start from ${branch}; current branch is ${currentBranch || 'detached HEAD'}`);
  }

  const staged = git(['diff', '--cached', '--name-only']).trim();
  if (staged) {
    fail(`commit or unstage pending files before release: ${staged.split('\n').join(', ')}`);
  }

  const head = git(['rev-parse', 'HEAD']).trim();
  const remoteOutput = git(['ls-remote', '--exit-code', 'origin', `refs/heads/${branch}`]).trim();
  const remoteHead = remoteOutput.split(/\s+/)[0];
  if (head !== remoteHead) {
    fail(`local ${head.slice(0, 12)} does not match origin/${branch} ${remoteHead.slice(0, 12)}; push the intended commit first`);
  }

  const dirty = git(['status', '--porcelain']).trim();
  if (dirty) {
    console.log('release-production: local working-tree changes are excluded; deploying the pushed HEAD commit in an isolated worktree');
  }

  const worktree = join(root, '.codex', 'tmp', 'release-worktrees', `${head.slice(0, 12)}-${process.pid}`);
  mkdirSync(dirname(worktree), { recursive: true });
  let registered = false;
  try {
    git(['worktree', 'add', '--detach', worktree, head], { stdio: 'inherit' });
    registered = true;
    run('npm', ['run', 'verify:publish'], { cwd: worktree, stdio: 'inherit' });
    if (dryRun) {
      console.log(`release-production: dry run passed for remote commit ${head}`);
    } else {
      run('npm', ['run', 'deploy:production'], { cwd: worktree, stdio: 'inherit' });
      console.log(`release-production: deployed and verified ${head}`);
    }
  } finally {
    if (registered) {
      try {
        git(['worktree', 'remove', '--force', worktree], { stdio: 'inherit' });
      } catch (error) {
        console.warn(`release-production: automatic worktree cleanup failed: ${error.message}`);
      }
    }
    rmSync(worktree, { recursive: true, force: true });
    git(['worktree', 'prune']);
  }
}

try {
  main();
} catch (error) {
  fail(error.stderr?.toString().trim() || error.message);
}
