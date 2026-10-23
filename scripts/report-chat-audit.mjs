#!/usr/bin/env node
import { existsSync, lstatSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { resolve, relative, isAbsolute, delimiter } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isIP } from 'node:net';
import { runExternal } from './lib/external-process.mjs';
import { withoutProxyEnv } from './lib/network-routes.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const child = args[0] === '--credential-child';
if (child) args.shift();
const options = new Map();
for (let index = 0; index < args.length; index += 2) {
  const key = args[index].replace(/^--/, '');
  if (!['date', 'kind', 'ip', 'request-id', 'conversation-id', 'output'].includes(key) || !args[index + 1] || options.has(key)) throw new Error('Invalid chat report options.');
  options.set(key, args[index + 1]);
}
const date = options.get('date') || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const kind = options.get('kind') || 'both';
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !['accepted', 'rejected', 'both'].includes(kind) || (options.has('ip') && !isIP(options.get('ip'))) || ['request-id', 'conversation-id'].some(key => options.has(key) && !uuid.test(options.get(key)))) throw new Error('Invalid date, kind or identity filter.');
mkdirSync(resolve(root, '.cache'), { recursive: true });
const cache = realpathSync(resolve(root, '.cache'));
const output = resolve(root, options.get('output') || `.cache/chat-audit-${date}-${Date.now()}.json`);
const inside = relative(cache, output);
const parentInside = relative(cache, realpathSync(resolve(output, '..')));
if (!inside || inside.startsWith('..') || isAbsolute(inside) || parentInside.startsWith('..') || isAbsolute(parentInside) || !output.endsWith('.json')) throw new Error('Private reports must stay in .cache as JSON.');
try { if (lstatSync(output).isSymbolicLink()) throw new Error('Output must not be a link.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }

if (!child) {
  const workspace = process.env.CODEX_WORKSPACE_ROOT;
  if (!workspace) throw new Error('Use a configured Harness workspace session.');
  const outside = path => { const within = relative(root, path); return within.startsWith('..') || isAbsolute(within); };
  const node = outside(process.execPath) ? process.execPath : (process.env.PATH || '').split(delimiter).map(directory => resolve(directory, process.platform === 'win32' ? 'node.exe' : 'node')).find(path => outside(path) && existsSync(path));
  if (!node) throw new Error('An enrolled host Node runtime is required.');
  await runExternal(resolve(workspace, 'host/python/harness-tools/Scripts/python.exe'), [
    resolve(workspace, 'harness/active/tools/credentialctl.py'), 'run', '--profile', 'xinbao-chat', '--cwd', root, '--no-window', '--',
    node, fileURLToPath(import.meta.url), '--credential-child', ...args, ...(!options.has('output') ? ['--output', output] : []),
  ], { cwd: root, shell: false, env: withoutProxyEnv(), timeoutMs: 90_000, capture: true, displayCommand: 'credentialctl private chat audit report' });
  console.log(`Private chat audit saved to ${output}`);
} else {
  try {
    if (!process.env.XINBAO_CHAT_ADMIN_TOKEN) throw new Error('Missing report configuration');
    const reports = await Promise.all((kind === 'both' ? ['accepted', 'rejected'] : [kind]).map(async selected => {
      let snapshot, offset = 0;
      const events = [];
      let metadata;
      do {
        const params = new URLSearchParams({ date, kind: selected, limit: '200', offset: String(offset) });
        if (snapshot !== undefined) params.set('snapshot', String(snapshot));
        const response = await fetch(`https://xinbaopedia.top/api/chat-with-xinbao/audit/?${params}`, {
          headers: { authorization: `Bearer ${process.env.XINBAO_CHAT_ADMIN_TOKEN}`, 'user-agent': 'xinbaopedia-deployment-browser-qa/1' },
          redirect: 'error', signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) throw new Error(`Private chat audit returned HTTP ${response.status}.`);
        const page = await response.json();
        if (!Array.isArray(page.events) || !Number.isInteger(page.snapshot) || page.snapshot > 2_000 || (page.nextOffset !== null && (!Number.isInteger(page.nextOffset) || page.nextOffset <= offset))) throw new Error('Invalid audit pagination.');
        metadata ??= page;
        snapshot ??= page.snapshot;
        events.push(...page.events);
        offset = page.nextOffset;
      } while (offset !== null);
      const { events: ignored, ...fields } = metadata;
      return { ...fields, completeSnapshot: events.length === snapshot, events: events.filter(event =>
        (!options.has('ip') || event.ip === options.get('ip').toLowerCase()) &&
        (!options.has('request-id') || event.id === options.get('request-id').toLowerCase()) &&
        (!options.has('conversation-id') || event.conversationId === options.get('conversation-id').toLowerCase())) };
    }));
    writeFileSync(output, JSON.stringify({ fetchedAt: new Date().toISOString(), date, timeZone: 'Asia/Tokyo', filters: Object.fromEntries([...options].filter(([key]) => key !== 'output')), reports }, null, 2));
  } catch (error) {
    console.error(error instanceof Error && /^Private chat audit returned HTTP \d+\.$/.test(error.message) ? error.message : 'Private chat audit failed; no credential values exposed.');
    process.exitCode = 1;
  }
}
