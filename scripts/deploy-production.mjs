#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const scope = 'xinbaopedia';
const project = 'xinbaopedia';
const productionUrl = 'https://xinbaopedia.top';
const vercelCliPackage = 'vercel@54.18.7';

function fail(message) {
  console.error(`deploy-production: ${message}`);
  process.exit(1);
}

function sanitizeEnv() {
  const env = { ...process.env };
  for (const key of [
    'http_proxy',
    'https_proxy',
    'HTTP_PROXY',
    'HTTPS_PROXY',
    'all_proxy',
    'ALL_PROXY',
    'NODE_TLS_REJECT_UNAUTHORIZED',
  ]) {
    delete env[key];
  }
  return env;
}

function redactArgs(args, env) {
  const token = env.VERCEL_TOKEN;
  return args.map((arg) => (token && arg === token ? '<redacted-token>' : arg));
}

function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      const displayArgs = redactArgs(args, env);
      if (signal) {
        reject(new Error(`${command} ${displayArgs.join(' ')} exited by signal ${signal}`));
        return;
      }
      if (code !== 0) {
        reject(new Error(`${command} ${displayArgs.join(' ')} exited with code ${code}`));
        return;
      }
      resolve();
    });
  });
}

function vercelArgs(command, args = []) {
  return ['--yes', vercelCliPackage, command, ...args];
}

function readPackageScripts() {
  const packagePath = join(root, 'package.json');
  if (!existsSync(packagePath)) {
    return {};
  }
  try {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    return packageJson.scripts || {};
  } catch (error) {
    fail(`could not parse package.json: ${error.message}`);
  }
}

async function runSmoke(env) {
  const smokeCandidates = [
    join(root, 'scripts', 'smoke-production.mjs'),
    join(root, 'scripts', 'smoke-site.mjs'),
  ];
  for (const scriptPath of smokeCandidates) {
    if (existsSync(scriptPath)) {
      await run(process.execPath, [scriptPath], { ...env, SITE_URL: productionUrl });
      return;
    }
  }

  const scripts = readPackageScripts();
  for (const scriptName of ['smoke:production', 'smoke']) {
    if (scripts[scriptName]) {
      await run('npm', ['run', scriptName], { ...env, SITE_URL: productionUrl });
      return;
    }
  }

  console.log(`deploy-production: no smoke script found; checking ${productionUrl}`);
  await checkProductionUrl(productionUrl);
}

function checkProductionUrl(url) {
  return new Promise((resolve, reject) => {
    const request = fetch(url, { redirect: 'follow' });
    request
      .then((response) => {
        if (!response.ok) {
          reject(new Error(`production check returned HTTP ${response.status}`));
          return;
        }
        console.log(`deploy-production: production check passed with HTTP ${response.status}`);
        resolve();
      })
      .catch(reject);
  });
}

async function main() {
  if (process.argv.slice(2).some((arg) => arg === '--token' || arg.startsWith('--token='))) {
    fail('do not pass tokens on the command line; set VERCEL_TOKEN in the environment');
  }

  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    fail('VERCEL_TOKEN is required in the environment');
  }

  const env = sanitizeEnv();
  env.VERCEL_TOKEN = token;

  await run('npx', vercelArgs('link', ['--yes', '--project', project, '--scope', scope]), env);
  await run('npx', vercelArgs('deploy', ['--prod', '--yes', '--scope', scope]), env);
  await runSmoke(env);
}

main().catch((error) => {
  fail(error.message);
});
