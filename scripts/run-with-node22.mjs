#!/usr/bin/env node

import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('run-with-node22: expected a command');
  process.exit(1);
}

const requiredMajor = 22;
const posixNode = join(root, '.tools', 'node-v22', 'bin', 'node');
const windowsNode = join(root, '.tools', 'runtime', 'node_modules', 'node', 'bin', 'node.exe');
const localNode = existsSync(posixNode)
  ? posixNode
  : process.platform === 'win32' && existsSync(windowsNode) ? windowsNode : posixNode;
const localBin = dirname(localNode);
const activeMajor = Number.parseInt(process.versions.node, 10);
const env = { ...process.env };

if (activeMajor !== requiredMajor) {
  if (!existsSync(localNode)) {
    console.error('run-with-node22: Node 22 is not installed for this project; run `npm run setup:node22` once');
    process.exit(1);
  }
  const localVersion = execFileSync(localNode, ['--version'], { encoding: 'utf8' }).trim();
  if (!localVersion.startsWith(`v${requiredMajor}.`)) {
    console.error(`run-with-node22: expected Node 22 at ${localNode}, found ${localVersion}`);
    process.exit(1);
  }
  env.PATH = `${localBin}${delimiter}${env.PATH || ''}`;
  console.log(`run-with-node22: using project runtime ${localVersion}`);
} else {
  console.log(`run-with-node22: using active runtime v${process.versions.node}`);
}

const child = spawn(args[0], args.slice(1), {
  cwd: root,
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
child.on('error', (error) => {
  console.error(`run-with-node22: ${error.message}`);
  process.exit(1);
});
child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`run-with-node22: command exited by signal ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});
