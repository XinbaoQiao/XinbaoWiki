#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import http from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  reusableDeploymentFromList,
  validateDeploymentIdentity,
  validateLinkedProjectIdentity,
  validateProductionDeploymentIdentity,
} from './lib/deployment-identity.mjs';
import { runExternal } from './lib/external-process.mjs';
import { stagedSmokeRoutes } from './lib/network-routes.mjs';
import { runReleaseOrchestrator } from './lib/release-orchestrator.mjs';
import {
  initializeReleaseState,
  readReleaseState,
  releaseFailureState,
  releaseNeedsProjectLink,
  releasePhaseForExecution,
  validateProductionVerifiedRelease,
  writeReleaseState,
} from './lib/release-state.mjs';

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
  let groundedChatPosts = 0;
  let contextGroundedChatPosts = 0;
  let contextGroundedReferer = '';
  let conversationalChatPosts = 0;
  let sensitiveChatPosts = 0;
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
    if (req.url?.startsWith('/okf/sources')) {
      json(res, { schemaVersion: 1, sources: [{ id: 'src-test', pages: ['Xinbao_Qiao'] }] });
      return;
    }
    if (req.method === 'GET' && req.url?.startsWith('/api/chat-with-xinbao?diagnostic=retrieval')) {
      json(res, {
        remaining: 10,
        limit: 10,
        meta: {
          backendVersion: 'xinbao-chat-api-v4',
          responsePolicyVersion: 'grounded-conversation-v2',
          promptVersion: 'xinbao-grounded-conversation-v3',
          retrievalAlgorithm: 'wiki-heading-lexical-v2',
          modelApiConfigured: true,
          indexVersion: 'wiki-heading-lexical-v2:test',
          indexFingerprint: '0'.repeat(64),
          indexedChunks: 1
        }
      });
      return;
    }
    if (req.method === 'POST' && req.url?.startsWith('/api/chat-with-xinbao')) {
      const chunks = [];
      req.setEncoding('utf8');
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => {
        const payload = JSON.parse(chunks.join(''));
        if (/system prompt/i.test(payload.message || '')) {
          sensitiveChatPosts += 1;
          json(res, {
            reply: 'I cannot provide protected system instructions meow~',
            sources: [],
            remaining: 9,
            limit: 10,
            meta: {
              backendVersion: 'xinbao-chat-api-v4',
              responsePolicyVersion: 'grounded-conversation-v2',
              responseMode: 'deterministic-abstention',
              promptVersion: 'xinbao-grounded-conversation-v3',
              indexVersion: 'wiki-heading-lexical-v2:test',
              citedChunks: 0,
              shouldAbstain: true,
              retrievalShouldAbstain: true,
              blockedReason: 'sensitive-query',
            },
          });
          return;
        }
        if (/sourdough/i.test(payload.message || '')) {
          conversationalChatPosts += 1;
          json(res, {
            reply: 'Sourdough usually benefits from patient fermentation and careful heat control meow~',
            sources: [],
            remaining: 9,
            limit: 10,
            meta: {
              backendVersion: 'xinbao-chat-api-v4',
              responsePolicyVersion: 'grounded-conversation-v2',
              responseMode: 'model-conversational',
              promptVersion: 'xinbao-grounded-conversation-v3',
              indexVersion: 'wiki-heading-lexical-v2:test',
              citedChunks: 0,
              shouldAbstain: false,
              retrievalShouldAbstain: true,
            },
          });
          return;
        }
        if (/what does this work do/i.test(payload.message || '')) {
          contextGroundedChatPosts += 1;
          contextGroundedReferer = req.headers.referer || '';
          json(res, {
            reply: 'This work presents DynFrs for efficient random-forest unlearning [1] meow~',
            sources: [{
              chunkId: 'DynFrs#overview',
              slug: 'DynFrs',
              title: 'DynFrs',
              section: 'Overview',
              href: '/wiki/DynFrs/#overview',
            }],
            remaining: 9,
            limit: 10,
            meta: {
              backendVersion: 'xinbao-chat-api-v4',
              responsePolicyVersion: 'grounded-conversation-v2',
              responseMode: 'model-grounded',
              promptVersion: 'xinbao-grounded-conversation-v3',
              indexVersion: 'wiki-heading-lexical-v2:test',
              citedChunks: 1,
              shouldAbstain: false,
              retrievalShouldAbstain: false,
            },
          });
          return;
        }
        groundedChatPosts += 1;
        json(res, {
          reply: 'DynFrs studies efficient random-forest unlearning [1] meow~',
          sources: [{
            chunkId: 'DynFrs#overview',
            slug: 'DynFrs',
            title: 'DynFrs',
            section: 'Overview',
            href: '/wiki/DynFrs/#overview',
          }],
          remaining: 9,
          limit: 10,
          meta: {
            backendVersion: 'xinbao-chat-api-v4',
            responsePolicyVersion: 'grounded-conversation-v2',
            responseMode: 'model-grounded',
            promptVersion: 'xinbao-grounded-conversation-v3',
            indexVersion: 'wiki-heading-lexical-v2:test',
            citedChunks: 1,
            shouldAbstain: false,
            retrievalShouldAbstain: false,
          },
        });
      });
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
    assert.equal(groundedChatPosts, 1, 'production smoke sends one grounded chat POST canary');
    assert.equal(contextGroundedChatPosts, 1, 'production smoke sends one page-context grounded POST canary');
    assert.equal(new URL(contextGroundedReferer).pathname, '/wiki/DynFrs/', 'page-context canary carries the current wiki page as Referer');
    assert.equal(conversationalChatPosts, 1, 'production smoke sends one conversational POST canary');
    assert.equal(sensitiveChatPosts, 1, 'production smoke sends one sensitive-query abstention POST canary');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function testExternalProcessTimeoutKillsTree() {
  const tempRoot = join(root, '.codex', 'tmp');
  mkdirSync(tempRoot, { recursive: true });
  const temp = mkdtempSync(join(tempRoot, 'process-timeout-test-'));
  const pidPath = join(temp, 'grandchild.pid');
  const script = [
    "const { spawn } = require('node:child_process');",
    "const { writeFileSync } = require('node:fs');",
    "const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });",
    "writeFileSync(process.argv[1], String(child.pid));",
    "setInterval(() => {}, 1000);",
  ].join('');

  try {
    const startedAt = Date.now();
    await assert.rejects(
      runExternal(process.execPath, ['-e', script, pidPath], {
        killGraceMs: 100,
        timeoutMs: 250,
      }),
      (error) => error.kind === 'timeout' && error.timeoutMs === 250
    );
    assert.ok(Date.now() - startedAt < 2_000, 'parent timeout bounds the full process tree');
    assert.ok(existsSync(pidPath), 'timeout fixture recorded its grandchild pid');
    const grandchildPid = Number.parseInt(readFileSync(pidPath, 'utf8'), 10);
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.throws(() => process.kill(grandchildPid, 0), /ESRCH/, 'timeout kills descendants, not only the direct child');
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

async function testExternalProcessOutputLimit() {
  await assert.rejects(
    runExternal(process.execPath, ['-e', "process.stdout.write('x'.repeat(4096))"], {
      maxOutputBytes: 1_024,
      timeoutMs: 2_000,
    }),
    (error) => error.kind === 'output_limit' && Buffer.byteLength(error.stdout) === 1_024
  );
}

function testNetworkRouteSelection() {
  const base = { PATH: process.env.PATH };
  assert.deepEqual(
    stagedSmokeRoutes(base, {}, 'auto').map((route) => route.name),
    ['direct'],
    'staged smoke uses direct access when no proxy is configured'
  );
  assert.deepEqual(
    stagedSmokeRoutes(base, { HTTPS_PROXY: 'http://127.0.0.1:17897' }, 'auto').map((route) => route.name),
    ['direct', 'proxy'],
    'staged smoke tries each distinct network route once'
  );
  assert.deepEqual(
    stagedSmokeRoutes(base, { HTTPS_PROXY: 'http://127.0.0.1:17897' }, 'proxy').map((route) => route.name),
    ['proxy'],
    'an explicit staged-smoke route is deterministic'
  );
}

function testReleaseStateRoundTrip() {
  const tempRoot = join(root, '.codex', 'tmp');
  mkdirSync(tempRoot, { recursive: true });
  const temp = mkdtempSync(join(tempRoot, 'release-state-test-'));
  const statePath = join(temp, 'release.json');
  try {
    writeReleaseState(statePath, {
      commit: 'abc123',
      deploymentUrl: 'https://example.vercel.app',
      lastSuccessfulPhase: 'staged',
      phase: 'failed',
    });
    const state = readReleaseState(statePath);
    assert.equal(state.schemaVersion, 1);
    assert.equal(state.commit, 'abc123');
    assert.equal(state.deploymentUrl, 'https://example.vercel.app');
    assert.match(state.updatedAt, /^\d{4}-\d{2}-\d{2}T/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

function testReleaseResumePhaseMatrix() {
  const failedCheckpoints = [
    [null, 'starting'],
    ['linked', 'linked'],
    ['staged', 'staged'],
    ['staged_verified', 'staged_verified'],
    ['promoted', 'promoted'],
    ['production_verified', 'production_verified'],
  ];

  for (const [lastSuccessfulPhase, expectedPhase] of failedCheckpoints) {
    const state = { phase: 'failed', lastSuccessfulPhase };
    assert.equal(
      releasePhaseForExecution(state, { resume: true }),
      expectedPhase,
      `resume continues from ${expectedPhase} after a failed release`
    );
  }

  assert.throws(
    () => releasePhaseForExecution({ phase: 'failed', lastSuccessfulPhase: 'unknown' }, { resume: true }),
    /cannot resume from unknown/,
    'a corrupt checkpoint cannot silently fall through as a successful release'
  );

  const firstLinkFailure = { phase: 'failed', lastSuccessfulPhase: null };
  const recoveredPhase = releasePhaseForExecution(firstLinkFailure, { resume: true });
  assert.equal(recoveredPhase, 'starting', 'a first-link failure resumes from the initial phase');

  for (const phase of ['starting', 'linked', 'staged', 'staged_verified', 'promoted']) {
    assert.equal(
      releaseNeedsProjectLink({ phase, resume: true }),
      true,
      `resume from ${phase} relinks the canonical project before continuing`
    );
  }
  assert.equal(
    releaseNeedsProjectLink({ phase: recoveredPhase, resume: true }),
    true,
    'the first-link failure recovery retries canonical project linking'
  );
  assert.equal(
    releaseNeedsProjectLink({ phase: 'linked', resume: false }),
    false,
    'a normal run does not duplicate project linking after its linked checkpoint'
  );
}

function testReleaseInitializationGuard() {
  const existingFailedState = {
    commit: 'abc123',
    deploymentId: 'dpl_test123',
    deploymentUrl: 'https://xinbaopedia-abc-xinbaopedia.vercel.app',
    lastSuccessfulPhase: 'staged',
    phase: 'failed',
  };
  assert.deepEqual(
    initializeReleaseState(null, { commit: 'abc123' }),
    { commit: 'abc123', lastSuccessfulPhase: null, phase: 'starting' },
    'a new commit with no durable state starts exactly once'
  );
  assert.equal(
    initializeReleaseState(existingFailedState, { commit: 'abc123', resume: true }),
    existingFailedState,
    'resume preserves the exact saved deployment checkpoint'
  );
  assert.throws(
    () => initializeReleaseState(existingFailedState, { commit: 'abc123' }),
    /already exists.*--resume/,
    'a normal rerun cannot overwrite a failed same-commit deployment checkpoint'
  );
  assert.throws(
    () => initializeReleaseState(null, { commit: 'abc123', resume: true }),
    /no release state found/,
    'resume requires an existing durable checkpoint'
  );
  assert.throws(
    () => initializeReleaseState(existingFailedState, { commit: 'other', resume: true }),
    /does not match current commit/,
    'resume cannot cross commit boundaries'
  );
}

function testDeploymentIdentityValidation() {
  const expected = {
    commit: 'abc123',
    deploymentUrl: 'https://xinbaopedia-abc-xinbaopedia.vercel.app',
    orgId: 'team_test123',
    project: 'xinbaopedia',
    projectId: 'prj_test123',
  };
  const validInspection = {
    id: 'dpl_test123',
    name: 'xinbaopedia',
    url: 'xinbaopedia-abc-xinbaopedia.vercel.app',
    readyState: 'READY',
    ownerId: 'team_test123',
    projectId: 'prj_test123',
    meta: {
      gitCommitAuthorName: 'Xinbao Qiao',
      gitCommitMessage: 'fixture from the Vercel v13 deployment schema',
      gitCommitSha: 'abc123',
    },
  };

  assert.deepEqual(
    validateDeploymentIdentity(JSON.stringify(validInspection), expected),
    {
      deploymentId: 'dpl_test123',
      deploymentUrl: 'https://xinbaopedia-abc-xinbaopedia.vercel.app',
    },
    'a canonical deployment with the exact release commit passes identity validation'
  );
  assert.deepEqual(
    validateProductionDeploymentIdentity(JSON.stringify(validInspection), expected),
    {
      commit: 'abc123',
      deploymentId: 'dpl_test123',
      deploymentUrl: 'https://xinbaopedia-abc-xinbaopedia.vercel.app',
    },
    'the production alias API record exposes the exact deployment id and commit'
  );
  assert.deepEqual(
    reusableDeploymentFromList(JSON.stringify({
      deployments: [{
        uid: 'dpl_test123',
        name: 'xinbaopedia',
        url: 'xinbaopedia-abc-xinbaopedia.vercel.app',
        readyState: 'READY',
        meta: { gitCommitSha: 'abc123' },
      }],
    }), expected),
    {
      deploymentId: 'dpl_test123',
      deploymentUrl: 'https://xinbaopedia-abc-xinbaopedia.vercel.app',
    },
    'resume reuses the unique READY deployment for the exact project commit'
  );
  assert.deepEqual(
    reusableDeploymentFromList(JSON.stringify({
      deployments: [{
        uid: 'dpl_building',
        name: 'xinbaopedia',
        url: 'xinbaopedia-building-xinbaopedia.vercel.app',
        readyState: 'BUILDING',
        meta: { gitCommitSha: 'abc123' },
      }],
    }), expected),
    {
      deploymentId: 'dpl_building',
      deploymentUrl: 'https://xinbaopedia-building-xinbaopedia.vercel.app',
    },
    'resume reuses an in-flight exact-commit deployment instead of deploying twice'
  );
  assert.throws(
    () => reusableDeploymentFromList(JSON.stringify({
      deployments: [
        {
          uid: 'dpl_first',
          name: 'xinbaopedia',
          url: 'xinbaopedia-first-xinbaopedia.vercel.app',
          readyState: 'READY',
          meta: { gitCommitSha: 'abc123' },
        },
        {
          uid: 'dpl_second',
          name: 'xinbaopedia',
          url: 'xinbaopedia-second-xinbaopedia.vercel.app',
          readyState: 'QUEUED',
          meta: { gitCommitSha: 'abc123' },
        },
      ],
    }), expected),
    /multiple reusable deployments|ambiguous release resume/,
    'multiple active exact-commit deployments fail closed instead of selecting one by timestamp'
  );
  assert.equal(
    reusableDeploymentFromList(JSON.stringify({
      deployments: [{
        uid: 'dpl_stale',
        name: 'xinbaopedia',
        url: 'xinbaopedia-stale-xinbaopedia.vercel.app',
        readyState: 'READY',
        meta: { gitCommitSha: 'stale' },
      }],
    }), expected),
    null,
    'resume never reuses a deployment from another commit'
  );

  for (const [label, patch, message] of [
    ['URL', { url: 'other.vercel.app' }, /URL does not match/],
    ['project', { name: 'other-project' }, /belongs to project/],
    ['project id', { projectId: 'prj_other' }, /project id/],
    ['scope owner', { ownerId: 'team_other' }, /owner/],
    ['readiness', { readyState: 'ERROR' }, /expected READY/],
    ['commit', { meta: { ...validInspection.meta, gitCommitSha: 'stale' } }, /commit metadata/],
  ]) {
    assert.throws(
      () => validateDeploymentIdentity(JSON.stringify({ ...validInspection, ...patch }), expected),
      message,
      `${label} mismatch blocks a stale or foreign deployment before promotion`
    );
  }


  assert.deepEqual(
    validateLinkedProjectIdentity({
      projectId: 'prj_test123',
      orgId: 'team_test123',
      projectName: 'xinbaopedia',
    }, 'xinbaopedia'),
    { projectId: 'prj_test123', orgId: 'team_test123' },
    'fresh or resumed worktrees use the explicit link result as the canonical deployment owner'
  );
  assert.throws(
    () => validateLinkedProjectIdentity({
      projectId: 'prj_stale',
      orgId: 'team_test123',
      projectName: 'stale-project',
    }, 'xinbaopedia'),
    /linked Vercel project/,
    'a stale .vercel project link is rejected after relinking'
  );
}

function testProductionVerifiedStateGate() {
  const expected = {
    commit: 'abc123',
    productionUrl: 'https://xinbaopedia.top',
  };
  const validState = {
    phase: 'production_verified',
    commit: 'abc123',
    productionUrl: 'https://xinbaopedia.top',
    deploymentId: 'dpl_test123',
    deploymentUrl: 'https://xinbaopedia-abc-xinbaopedia.vercel.app',
  };
  assert.equal(
    validateProductionVerifiedRelease(validState, expected),
    validState,
    'the outer release accepts only the exact verified production state'
  );
  for (const [label, state, message] of [
    ['missing state', null, /without a production_verified/],
    ['wrong phase', { ...validState, phase: 'promoted' }, /without a production_verified/],
    ['wrong commit', { ...validState, commit: 'stale' }, /released commit/],
    ['wrong domain', { ...validState, productionUrl: 'https://other.example' }, /canonical production URL/],
    ['missing deployment', { ...validState, deploymentUrl: '' }, /valid Vercel deployment URL/],
    ['missing deployment id', { ...validState, deploymentId: '' }, /valid Vercel deployment id/],
  ]) {
    assert.throws(
      () => validateProductionVerifiedRelease(state, expected),
      message,
      `${label} cannot produce a false deployed-and-verified success`
    );
  }
}

function releaseOrchestratorFixture(initialState, overrides = {}) {
  const calls = [];
  let currentState = { ...initialState };
  const stagedUrl = 'https://xinbaopedia-abc-xinbaopedia.vercel.app';
  const candidateDeploymentId = overrides.deploymentId ?? 'dpl_test123';
  const startsBound = ['promoted', 'production_verified'].includes(initialState.lastSuccessfulPhase);
  let liveDeploymentId = overrides.liveDeploymentId
    ?? (startsBound ? initialState.deploymentId : 'dpl_previous');
  let liveCommit = overrides.liveCommit
    ?? (startsBound ? initialState.commit : 'previous');
  const checkpoint = (phase, extra = {}) => {
    calls.push(`checkpoint:${phase}`);
    currentState = {
      ...currentState,
      ...extra,
      lastSuccessfulPhase: phase,
      phase,
    };
  };
  const operations = {
    async link() {
      calls.push('link');
      if (overrides.linkError) throw overrides.linkError;
      return { orgId: 'team_test123', projectId: 'prj_test123' };
    },
    async deploy() {
      calls.push('deploy');
      if (overrides.deployError) throw overrides.deployError;
      return overrides.deploymentUrl ?? stagedUrl;
    },
    async findExistingDeployment() {
      calls.push('findExistingDeployment');
      if (overrides.findExistingError) throw overrides.findExistingError;
      return overrides.findExistingDeployment ?? null;
    },
    async inspect() {
      calls.push('inspect');
      if (overrides.inspectError) throw overrides.inspectError;
      return { deploymentId: candidateDeploymentId, deploymentUrl: stagedUrl };
    },
    async stagedSmoke() {
      calls.push('stagedSmoke');
      if (overrides.stagedSmokeError) throw overrides.stagedSmokeError;
      return [{ label: 'fixture', status: 'passed' }];
    },
    async promote() {
      calls.push('promote');
      if (overrides.promoteError) throw overrides.promoteError;
      if (!overrides.promoteDoesNotBind) {
        liveDeploymentId = candidateDeploymentId;
        liveCommit = initialState.commit;
      }
    },
    async productionSmoke() {
      calls.push('productionSmoke');
      if (overrides.productionSmokeError) throw overrides.productionSmokeError;
    },
    async productionIdentity() {
      calls.push('productionIdentity');
      if (overrides.productionIdentityError) throw overrides.productionIdentityError;
      return { commit: liveCommit, deploymentId: liveDeploymentId };
    },
  };

  return {
    calls,
    getState: () => currentState,
    run: (options = {}) => runReleaseOrchestrator({
      checkpoint,
      operations,
      productionUrl: 'https://xinbaopedia.top',
      resume: options.resume ?? true,
      state: currentState,
    }),
  };
}

async function testReleaseOrchestratorMatrix() {
  const stagedUrl = 'https://xinbaopedia-abc-xinbaopedia.vercel.app';
  const fullTail = [
    'stagedSmoke',
    'checkpoint:staged_verified',
    'productionIdentity',
    'promote',
    'checkpoint:promoted',
    'productionSmoke',
    'productionIdentity',
    'checkpoint:production_verified',
  ];
  const matrix = [
    {
      lastSuccessfulPhase: null,
      expected: [
        'link',
        'checkpoint:linked',
        'findExistingDeployment',
        'checkpoint:linked',
        'deploy',
        'checkpoint:staged',
        'inspect',
        'checkpoint:staged',
        ...fullTail,
      ],
    },
    {
      lastSuccessfulPhase: 'linked',
      expected: [
        'link',
        'findExistingDeployment',
        'checkpoint:linked',
        'deploy',
        'checkpoint:staged',
        'inspect',
        'checkpoint:staged',
        ...fullTail,
      ],
    },
    {
      lastSuccessfulPhase: 'staged',
      deploymentUrl: stagedUrl,
      deploymentId: 'dpl_test123',
      expected: ['link', 'inspect', 'checkpoint:staged', ...fullTail],
    },
    {
      lastSuccessfulPhase: 'staged_verified',
      deploymentUrl: stagedUrl,
      deploymentId: 'dpl_test123',
      expected: [
        'link',
        'inspect',
        'checkpoint:staged_verified',
        'productionIdentity',
        'promote',
        'checkpoint:promoted',
        'productionSmoke',
        'productionIdentity',
        'checkpoint:production_verified',
      ],
    },
    {
      lastSuccessfulPhase: 'promoted',
      deploymentUrl: stagedUrl,
      deploymentId: 'dpl_test123',
      expected: [
        'link',
        'inspect',
        'checkpoint:promoted',
        'productionSmoke',
        'productionIdentity',
        'checkpoint:production_verified',
      ],
    },
    {
      lastSuccessfulPhase: 'production_verified',
      deploymentUrl: stagedUrl,
      deploymentId: 'dpl_test123',
      expected: ['link', 'inspect', 'productionSmoke', 'productionIdentity'],
    },
  ];

  for (const row of matrix) {
    const fixture = releaseOrchestratorFixture({
      commit: 'abc123',
      deploymentId: row.deploymentId,
      deploymentUrl: row.deploymentUrl,
      lastSuccessfulPhase: row.lastSuccessfulPhase,
      phase: 'failed',
      productionUrl: row.lastSuccessfulPhase === 'production_verified'
        ? 'https://xinbaopedia.top'
        : undefined,
    });
    const result = await fixture.run();
    assert.deepEqual(
      fixture.calls,
      row.expected,
      `resume from ${row.lastSuccessfulPhase ?? 'first-link failure'} follows the exact operation sequence`
    );
    assert.equal(result.phase, 'production_verified');
  }

  const firstLinkFailure = releaseOrchestratorFixture({
    commit: 'abc123',
    lastSuccessfulPhase: null,
    phase: 'starting',
  }, { linkError: new Error('link unavailable') });
  await assert.rejects(() => firstLinkFailure.run({ resume: false }), /link unavailable/);
  const failedLinkState = releaseFailureState(firstLinkFailure.getState(), {
    commit: 'abc123',
    error: { kind: 'fixture', message: 'link unavailable' },
  });
  assert.equal(failedLinkState.phase, 'failed');
  assert.equal(failedLinkState.lastSuccessfulPhase, null);
  const recoveredLink = releaseOrchestratorFixture(failedLinkState);
  await recoveredLink.run();
  assert.equal(recoveredLink.calls[0], 'link', 'resume retries canonical link after its first failure');

  const inspectFailure = releaseOrchestratorFixture({
    commit: 'abc123',
    lastSuccessfulPhase: null,
    phase: 'starting',
  }, { inspectError: new Error('deployment API unavailable') });
  await assert.rejects(() => inspectFailure.run({ resume: false }), /deployment API unavailable/);
  assert.equal(inspectFailure.getState().lastSuccessfulPhase, 'staged');
  assert.equal(inspectFailure.getState().deploymentUrl, stagedUrl);
  const failedInspectState = releaseFailureState(inspectFailure.getState(), {
    commit: 'abc123',
    error: { kind: 'fixture', message: 'deployment API unavailable' },
  });
  const recoveredInspect = releaseOrchestratorFixture(failedInspectState);
  await recoveredInspect.run();
  assert.equal(recoveredInspect.calls.includes('deploy'), false, 'resume reuses a staged URL after a transient identity API failure');
  assert.deepEqual(recoveredInspect.calls.slice(0, 2), ['link', 'inspect']);

  const mismatchedDeployment = releaseOrchestratorFixture({
    commit: 'abc123',
    deploymentId: 'dpl_expected',
    deploymentUrl: stagedUrl,
    lastSuccessfulPhase: 'staged_verified',
    phase: 'failed',
  }, { deploymentId: 'dpl_foreign' });
  await assert.rejects(() => mismatchedDeployment.run(), /deployment id does not match/);
  assert.equal(mismatchedDeployment.calls.includes('promote'), false, 'a mismatched deployment id is never promoted');

  const identityFailure = releaseOrchestratorFixture({
    commit: 'abc123',
    deploymentUrl: stagedUrl,
    lastSuccessfulPhase: 'staged_verified',
    phase: 'failed',
  }, { inspectError: new Error('commit metadata mismatch') });
  await assert.rejects(() => identityFailure.run(), /commit metadata mismatch/);
  assert.equal(identityFailure.calls.includes('promote'), false, 'an identity validation failure is never promoted');

  const deployCrashRecovery = releaseOrchestratorFixture({
    commit: 'abc123',
    lastSuccessfulPhase: 'linked',
    phase: 'failed',
  }, {
    findExistingDeployment: {
      deploymentId: 'dpl_test123',
      deploymentUrl: stagedUrl,
    },
  });
  await deployCrashRecovery.run();
  assert.equal(deployCrashRecovery.calls.includes('deploy'), false, 'resume discovers the exact-commit deployment after a post-deploy crash');
  assert.deepEqual(
    deployCrashRecovery.calls.slice(0, 4),
    ['link', 'findExistingDeployment', 'checkpoint:staged', 'inspect']
  );

  const pendingDeployRecovery = releaseOrchestratorFixture({
    commit: 'abc123',
    deploymentAttempted: true,
    lastSuccessfulPhase: 'linked',
    phase: 'failed',
  });
  await assert.rejects(
    () => pendingDeployRecovery.run(),
    /deployment was already attempted.*refusing to create a duplicate/
  );
  assert.equal(pendingDeployRecovery.calls.includes('deploy'), false, 'an unobservable prior deployment attempt fails closed');

  const promoteCrashRecovery = releaseOrchestratorFixture({
    commit: 'abc123',
    deploymentId: 'dpl_test123',
    deploymentUrl: stagedUrl,
    lastSuccessfulPhase: 'staged_verified',
    phase: 'failed',
  }, { liveCommit: 'abc123', liveDeploymentId: 'dpl_test123' });
  await promoteCrashRecovery.run();
  assert.equal(promoteCrashRecovery.calls.includes('promote'), false, 'resume detects an already-bound production alias after a post-promote crash');
  assert.deepEqual(
    promoteCrashRecovery.calls.slice(0, 5),
    ['link', 'inspect', 'checkpoint:staged_verified', 'productionIdentity', 'checkpoint:promoted']
  );

  const concurrentAliasChange = releaseOrchestratorFixture({
    commit: 'abc123',
    deploymentId: 'dpl_test123',
    deploymentUrl: stagedUrl,
    lastSuccessfulPhase: 'promoted',
    phase: 'failed',
  }, { liveCommit: 'other', liveDeploymentId: 'dpl_other' });
  await assert.rejects(() => concurrentAliasChange.run(), /production domain does not point/);
  assert.equal(
    concurrentAliasChange.calls.includes('checkpoint:production_verified'),
    false,
    'a concurrent production alias change cannot be recorded as verified'
  );

  const staleVerifiedState = releaseOrchestratorFixture({
    commit: 'abc123',
    deploymentId: 'dpl_test123',
    deploymentUrl: stagedUrl,
    lastSuccessfulPhase: 'production_verified',
    phase: 'failed',
    productionUrl: 'https://xinbaopedia.top',
  }, { liveCommit: 'other', liveDeploymentId: 'dpl_other' });
  await assert.rejects(() => staleVerifiedState.run(), /production domain does not point/);
  assert.deepEqual(
    staleVerifiedState.calls,
    ['link', 'inspect', 'productionSmoke', 'productionIdentity'],
    'resuming a production_verified state revalidates the live alias instead of trusting stale local state'
  );
}

function testStagedControlFileGate() {
  for (const { file, expected } of [
    { file: 'AGENTS.md', expected: 'blocked staged path' },
    { file: 'CLAUDE.md', expected: 'blocked staged path' },
    { file: 'artifacts/probe.json', expected: 'blocked path' },
  ]) {
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
      assert.match(output, new RegExp(`${file.replaceAll('.', '\\.').replaceAll('/', '\\/')}: ${expected}`), `staged publish gate rejects ${file}`);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  }
}

await testSmokeRetry();
await testExternalProcessTimeoutKillsTree();
await testExternalProcessOutputLimit();
await testReleaseOrchestratorMatrix();
testNetworkRouteSelection();
testReleaseStateRoundTrip();
testReleaseResumePhaseMatrix();
testReleaseInitializationGuard();
testDeploymentIdentityValidation();
testProductionVerifiedStateGate();
testStagedControlFileGate();
console.log('Release workflow tests passed');
