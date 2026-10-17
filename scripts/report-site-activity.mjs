#!/usr/bin/env node
import { existsSync, writeFileSync, realpathSync, lstatSync } from 'node:fs';
import { resolve, relative, isAbsolute, delimiter } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runExternal } from './lib/external-process.mjs';
import { withoutProxyEnv } from './lib/network-routes.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const child = args[0] === '--credential-child';
if (child) args.shift();
const mode = args.shift() || 'events';
if (!['events', 'summary', 'exclusions'].includes(mode)) throw new Error('Use events, summary or exclusions.');
const query = new URLSearchParams();
let output = '';
const allowed = mode !== 'summary' ? ['date', 'limit', 'offset', 'snapshot'] : ['days', 'start', 'end'];
for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace(/^--/, '');
  const value = args[i + 1];
  if (!value || (key !== 'output' && !allowed.includes(key)) || query.has(key)) throw new Error('Invalid report arguments.');
  if (key === 'output') {
    if (output) throw new Error('Duplicate output option.');
    const target = resolve(root, value);
    const within = relative(resolve(root, '.cache'), target);
    if (!within || within.startsWith('..') || isAbsolute(within) || !target.endsWith('.json')) throw new Error('Save private reports only as JSON inside .cache.');
    const parent = realpathSync(resolve(target, '..'));
    const realBase = realpathSync(resolve(root, '.cache'));
    const realWithin = relative(realBase, parent);
    if (realWithin.startsWith('..') || isAbsolute(realWithin)) throw new Error('Private report output cannot follow a link outside .cache.');
    try {
      if (lstatSync(target).isSymbolicLink()) throw new Error('Private report output cannot be a symbolic link.');
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    output = target;
  } else query.set(key, value);
}

if (!child) {
  const workspace = process.env.CODEX_WORKSPACE_ROOT;
  if (!workspace) throw new Error('Run the report from a Harness workspace session with CODEX_WORKSPACE_ROOT configured.');
  const credentialctl = resolve(workspace, 'harness/active/tools/credentialctl.py');
  const python = resolve(workspace, 'host/python/harness-tools/Scripts/python.exe');
  if (!existsSync(credentialctl) || !existsSync(python)) throw new Error('The named Harness credential runtime is unavailable.');
  // A project-local build runtime may not be enrolled for credential access.
  // Resolve the existing host Node; credentialctl still verifies its enrollment
  // before injecting any values. This never edits credential bindings.
  const outsideProject = path => { const within = relative(root, path); return within.startsWith('..') || isAbsolute(within); };
  const node = outsideProject(process.execPath) ? process.execPath : (process.env.PATH || '').split(delimiter)
    .map(directory => resolve(directory, process.platform === 'win32' ? 'node.exe' : 'node'))
    .find(path => outsideProject(path) && existsSync(path));
  if (!node) throw new Error('An enrolled host Node runtime is required for the private report.');
  const result = await runExternal(python, [credentialctl, 'run', '--profile', 'xinbao-chat', '--cwd', root,
    '--no-window', '--', node, fileURLToPath(import.meta.url), '--credential-child', ...process.argv.slice(2)],
  { cwd: root, shell: false, timeoutMs: 30_000, capture: true, env: withoutProxyEnv(), displayCommand: 'credentialctl private site activity report' });
  // credentialctl can intentionally suppress child stdout. A private output file
  // is the reliable artifact; no credential value enters the parent environment.
  if (result.stdout) process.stdout.write(result.stdout);
  if (output) console.log(`Private report saved to ${output}`);
  else console.log('Report query completed. Add --output .cache/activity-report.json to retain the response.');
} else {
  try {
    if (!process.env.XINBAO_CHAT_ADMIN_TOKEN) throw new Error('missing credential');
    const response = await fetch(`https://xinbaopedia.top/api/site-activity/${mode}/?${query}`, {
      headers: { authorization: `Bearer ${process.env.XINBAO_CHAT_ADMIN_TOKEN}`, 'user-agent': 'xinbaopedia-owner-read/1' },
      redirect: 'error', signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      console.error(`Private activity report returned HTTP ${response.status}.`);
      process.exitCode = 1;
    } else {
      const json = JSON.stringify(await response.json(), null, 2);
      if (output) writeFileSync(output, json);
      else console.log(json);
    }
  } catch {
    console.error('Private activity report request failed; no credential values exposed.');
    process.exitCode = 1;
  }
}
