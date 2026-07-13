#!/usr/bin/env node

import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const scope = 'xinbaopedia';
const project = 'xinbaopedia';
const productionUrl = 'https://xinbaopedia.top';
const vercelCliVersion = '54.18.7';
const vercelCliPackage = `vercel@${vercelCliVersion}`;
const proxyEnvKeys = [
  'http_proxy',
  'https_proxy',
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'all_proxy',
  'ALL_PROXY',
];

function fail(message) {
  console.error(`deploy-production: ${message}`);
  process.exit(1);
}

function sanitizeEnv() {
  const env = { ...process.env };
  for (const key of [...proxyEnvKeys, 'NODE_TLS_REJECT_UNAUTHORIZED']) {
    delete env[key];
  }
  return env;
}

function configuredProxyEnv(baseEnv) {
  const env = { ...baseEnv };
  for (const key of proxyEnvKeys) {
    if (process.env[key]) env[key] = process.env[key];
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

function runCapture(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });
    let stdout = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      process.stderr.write(chunk);
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
      resolve(stdout.trim());
    });
  });
}

function git(args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function requireCleanDeploymentTree() {
  const status = git(['status', '-sb']).trim();
  const porcelain = git(['status', '--porcelain']).trim();
  if (porcelain) {
    fail('working tree must be clean before production deploy; commit, stash, or ignore local changes first');
  }
  if (/\[(?:ahead|behind|ahead \d+, behind|behind \d+, ahead)/.test(status)) {
    fail(`local branch must match its upstream before production deploy: ${status.split('\n')[0]}`);
  }
}

function vercelBinName() {
  return process.platform === 'win32' ? 'vercel.cmd' : 'vercel';
}

function vercelArgs(command, args = []) {
  return [command, ...args];
}

function deploymentUrlFromOutput(output) {
  try {
    const parsed = JSON.parse(output);
    if (typeof parsed?.deployment?.url === 'string') return parsed.deployment.url;
  } catch {
    // Interactive Vercel CLI output is a plain deployment URL rather than JSON.
  }
  return output.match(/https:\/\/[^\s"']+\.vercel\.app\/?/)?.[0] || '';
}

function packageVersion(packageJsonPath) {
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
  } catch {
    return null;
  }
}

function resolveCachedVercelBin() {
  const localBin = join(root, 'node_modules', '.bin', vercelBinName());
  const localPackageJson = join(root, 'node_modules', 'vercel', 'package.json');
  if (existsSync(localBin) && packageVersion(localPackageJson) === vercelCliVersion) {
    return localBin;
  }

  const cacheRoot = process.env.npm_config_cache || join(homedir(), '.npm');
  const npxRoot = join(cacheRoot, '_npx');
  if (!existsSync(npxRoot)) {
    return null;
  }

  for (const entry of readdirSync(npxRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const packageRoot = join(npxRoot, entry.name, 'node_modules', 'vercel');
    const packageJsonPath = join(packageRoot, 'package.json');
    if (packageVersion(packageJsonPath) !== vercelCliVersion) continue;
    const binPath = join(npxRoot, entry.name, 'node_modules', '.bin', vercelBinName());
    if (existsSync(binPath)) return binPath;
  }

  return null;
}

function requireVercelCommand() {
  const command = resolveCachedVercelBin();
  if (command) return command;
  fail(`Vercel CLI ${vercelCliPackage} is not available in node_modules or the npm _npx cache; warm the cache with npm exec --package ${vercelCliPackage} -- vercel whoami`);
}

function cleanupGeneratedEnvFile(hadLocalEnv) {
  if (hadLocalEnv) return;
  rmSync(join(root, '.env.local'), { force: true });
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

async function runSmoke(env, siteUrl = productionUrl) {
  const smokeCandidates = [
    join(root, 'scripts', 'smoke-production.mjs'),
    join(root, 'scripts', 'smoke-site.mjs'),
  ];
  for (const scriptPath of smokeCandidates) {
    if (existsSync(scriptPath)) {
      await run(process.execPath, [scriptPath], { ...env, SITE_URL: siteUrl });
      return;
    }
  }

  const scripts = readPackageScripts();
  for (const scriptName of ['smoke:production', 'smoke']) {
    if (scripts[scriptName]) {
      await run('npm', ['run', scriptName], { ...env, SITE_URL: siteUrl });
      return;
    }
  }

  console.log(`deploy-production: no smoke script found; checking ${siteUrl}`);
  await checkProductionUrl(siteUrl);
}

async function runStagedSmoke(vercelCommand, env, stagedUrl) {
  const checks = [
    { path: '/', patterns: [/Xinbaopedia/i] },
    { path: '/wiki/Xinbao_Qiao/', patterns: [/Xinbao/i, /wiki-page|Xinbaopedia/i] },
    { path: '/robots.txt', patterns: [/Sitemap: https:\/\/xinbaopedia\.top\/sitemap\.xml/] },
    { path: '/sitemap.xml', patterns: [/\/wiki\/Xinbao_Qiao\//] },
    { path: '/search-index.json', patterns: [/"slug":"Xinbao_Qiao"/] },
    { path: '/api/chat-with-xinbao/', patterns: [/"limit":10/] },
  ];

  for (const check of checks) {
    let body;
    let lastError;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        body = await runCapture(
          vercelCommand,
          vercelArgs('curl', [
            check.path,
            '--deployment', stagedUrl,
            '--yes',
            '--', '--silent', '--show-error', '--max-time', '30',
          ]),
          env
        );
        break;
      } catch (error) {
        lastError = error;
        if (attempt < 2) {
          console.warn(`deploy-production: retrying staged smoke for ${check.path}`);
        }
      }
    }
    if (body === undefined) throw lastError;
    for (const pattern of check.patterns) {
      if (!pattern.test(body)) {
        throw new Error(`staged smoke failed for ${check.path}: missing ${pattern}`);
      }
    }
  }
  console.log(`deploy-production: staged smoke passed for ${stagedUrl}`);
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
  const smokeEnv = configuredProxyEnv(env);
  const vercelCommand = requireVercelCommand();
  const hadLocalEnv = existsSync(join(root, '.env.local'));
  const cleanupOnSignal = (exitCode) => {
    cleanupGeneratedEnvFile(hadLocalEnv);
    process.exit(exitCode);
  };
  process.once('SIGINT', () => cleanupOnSignal(130));
  process.once('SIGTERM', () => cleanupOnSignal(143));

  try {
    requireCleanDeploymentTree();
    await run(vercelCommand, vercelArgs('link', ['--yes', '--project', project, '--scope', scope]), env);
    const deploymentOutput = await runCapture(
      vercelCommand,
      vercelArgs('deploy', ['--prod', '--skip-domain', '--yes', '--scope', scope]),
      env
    );
    const stagedUrl = deploymentUrlFromOutput(deploymentOutput);
    if (!/^https:\/\/[^\s]+\.vercel\.app\/?$/.test(stagedUrl)) {
      throw new Error('Vercel did not return a valid staged deployment URL');
    }
    console.log(`deploy-production: staged deployment ready at ${stagedUrl}`);
    await runStagedSmoke(vercelCommand, smokeEnv, stagedUrl);
    await run(vercelCommand, vercelArgs('promote', [stagedUrl, '--yes', '--scope', scope]), env);
    await runSmoke(env, productionUrl);
  } finally {
    cleanupGeneratedEnvFile(hadLocalEnv);
  }
}

main().catch((error) => {
  fail(error.message);
});
