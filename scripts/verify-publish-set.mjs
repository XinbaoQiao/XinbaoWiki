#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, posix, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

const blockedPathPatterns = [
  { pattern: /(^|\/)\.env(?:$|[./_-])/, reason: 'environment file' },
  { pattern: /(^|\/)\.secrets(?:\/|$)/, reason: 'local secrets directory' },
  { pattern: /(^|\/)node_modules(?:\/|$)/, reason: 'dependency cache' },
  { pattern: /(^|\/)\.next(?:\/|$)/, reason: 'Next.js build cache' },
  { pattern: /(^|\/)\.vercel(?:\/|$)/, reason: 'Vercel local state' },
  { pattern: /(^|\/)\.vercel-auth[^/]*(?:\/|$)/, reason: 'temporary Vercel auth state' },
  { pattern: /(^|\/)\.npm-cache(?:\/|$)/, reason: 'npm cache' },
  { pattern: /(^|\/)\.omx(?:\/|$)/, reason: 'local runtime metadata' },
  { pattern: /(^|\/)(?:cache|logs?|outputs?|tmp|temp)(?:\/|$)/, reason: 'runtime artifact path' },
  { pattern: /(^|\/).*\.(?:token|pem|key|p12|pfx)$/i, reason: 'credential-like file' },
];

const blockedStagedPathPatterns = [
  { pattern: /(^|\/)AGENTS\.md$/, reason: 'agent instruction file requires explicit publication approval' },
  { pattern: /(^|\/)CLAUDE\.md$/, reason: 'agent instruction file requires explicit publication approval' },
  { pattern: /(^|\/)DESIGN\.md$/, reason: 'local design contract requires explicit publication approval' },
  { pattern: /(^|\/)agent_progress\.md$/, reason: 'local agent ledger' },
  { pattern: /(^|\/)\.codex(?:\/|$)/, reason: 'local Codex state' },
  { pattern: /(^|\/)\.omx(?:\/|$)/, reason: 'local OMX state' },
];

const stagedOnly = process.argv.includes('--staged-only');
const allowControlFiles = process.argv.includes('--allow-control-files');

const blockedContentPatterns = [
  { pattern: /\/data\/qiaoxinbao(?:\/|$)/, reason: 'local absolute path' },
  { pattern: /\/home\/qiaoxinbao(?:\/|$)/, reason: 'local absolute path' },
  { pattern: /(?:^|[\s"'=])\/(?:Users|home|data)\/[A-Za-z0-9._-]+(?:\/|$)/m, reason: 'local absolute path' },
  { pattern: /[A-Za-z]:\\Users\\[A-Za-z0-9._-]+\\/m, reason: 'local absolute path' },
  { pattern: /(?:api[_-]?key|secret|token)\s*[:=]\s*['"][^'"\n]{12,}['"]/i, reason: 'credential-like assignment' },
  { pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/, reason: 'private key material' },
];

function git(args, options = {}) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: options.encoding || 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function splitNul(output) {
  return output.split('\0').filter(Boolean);
}

function normalizePath(file) {
  return file.split(sep).join(posix.sep);
}

function trackedFiles() {
  return splitNul(git(['ls-files', '-z']));
}

function stagedFiles() {
  return splitNul(git(['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR']));
}

function untrackedFiles() {
  return splitNul(git(['ls-files', '--others', '--exclude-standard', '-z']));
}

function isBinary(buffer) {
  return buffer.includes(0);
}

function readPublishContent(file) {
  const absolute = join(root, file);
  if (!existsSync(absolute) || !statSync(absolute).isFile()) {
    return null;
  }
  const buffer = readFileSync(absolute);
  if (isBinary(buffer)) {
    return null;
  }
  return buffer.toString('utf8');
}

function readStagedContent(file) {
  try {
    const buffer = execFileSync('git', ['show', `:${file}`], {
      cwd: root,
      encoding: 'buffer',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (isBinary(buffer)) {
      return null;
    }
    return buffer.toString('utf8');
  } catch {
    return null;
  }
}

function checkPath(file, issues) {
  const normalized = normalizePath(file);
  for (const rule of blockedPathPatterns) {
    if (rule.pattern.test(normalized)) {
      issues.push(`${file}: blocked path (${rule.reason})`);
    }
  }
}

function checkStagedPath(file, issues) {
  if (allowControlFiles) return;
  const normalized = normalizePath(file);
  for (const rule of blockedStagedPathPatterns) {
    if (rule.pattern.test(normalized)) {
      issues.push(`${file}: blocked staged path (${rule.reason}; rerun with --allow-control-files only after explicit approval)`);
    }
  }
}

function checkContent(file, content, source, issues) {
  if (content === null) {
    return;
  }
  for (const rule of blockedContentPatterns) {
    if (rule.pattern.test(content)) {
      issues.push(`${file}: blocked ${source} content (${rule.reason})`);
    }
  }
}

function main() {
  const tracked = trackedFiles();
  const stagedList = stagedFiles();
  const untracked = untrackedFiles();
  if (stagedOnly && stagedList.length === 0) {
    console.error('verify-publish-set: no staged files to verify');
    process.exit(1);
  }
  const files = new Set(stagedOnly ? stagedList : [...tracked, ...stagedList, ...untracked]);
  const staged = new Set(stagedFiles());
  const issues = [];

  for (const file of [...files].sort()) {
    checkPath(file, issues);
    if (staged.has(file)) checkStagedPath(file, issues);
    if (!stagedOnly) checkContent(file, readPublishContent(file), 'working-tree', issues);
    if (staged.has(file)) {
      checkContent(file, readStagedContent(file), 'staged', issues);
    }
  }

  if (issues.length > 0) {
    console.error('verify-publish-set: publish set is not safe:');
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  if (stagedList.length > 0) {
    console.log(`verify-publish-set: staged publish set: ${stagedList.sort().join(', ')}`);
  }
  console.log(`verify-publish-set: checked ${files.size} ${stagedOnly ? 'staged' : 'publishable'} files; no blocked secrets, caches, staged control files, or absolute paths found`);
}

main();
