import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export function readReleaseState(path) {
  if (!path || !existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function initializeReleaseState(existingState, { commit, resume = false }) {
  if (resume) {
    if (!existingState) {
      throw new Error('no release state found; start a new release without --resume');
    }
    if (existingState.commit !== commit) {
      throw new Error(`release state commit ${existingState.commit} does not match current commit ${commit}`);
    }
    return existingState;
  }
  if (existingState) {
    throw new Error('release state already exists for this commit; use --resume so the saved deployment is reused');
  }
  return { commit, lastSuccessfulPhase: null, phase: 'starting' };
}

export function releasePhaseForExecution(state, { resume = false } = {}) {
  const phase = !resume
    ? 'starting'
    : state?.phase === 'failed'
      ? state.lastSuccessfulPhase ?? 'starting'
      : state?.phase;
  const knownPhases = new Set([
    'starting',
    'linked',
    'staged',
    'staged_verified',
    'promoted',
    'production_verified',
  ]);
  if (!knownPhases.has(phase)) {
    throw new Error(`release cannot resume from ${phase || 'unknown'}`);
  }
  return phase;
}

export function releaseNeedsProjectLink({ phase, resume = false }) {
  return resume || phase === 'starting';
}

export function releaseFailureState(state, { commit, error }) {
  return {
    ...state,
    commit,
    error,
    failedPhase: state.phase,
    phase: 'failed',
  };
}

export function validateProductionVerifiedRelease(state, { commit, productionUrl }) {
  if (!state || state.phase !== 'production_verified') {
    throw new Error('deployment process exited without a production_verified release state');
  }
  if (state.commit !== commit) {
    throw new Error('production_verified release state does not match the released commit');
  }
  if (state.productionUrl !== productionUrl) {
    throw new Error('production_verified release state does not match the canonical production URL');
  }
  if (typeof state.deploymentUrl !== 'string' || !/^https:\/\/[^\s]+\.vercel\.app\/?$/.test(state.deploymentUrl)) {
    throw new Error('production_verified release state is missing a valid Vercel deployment URL');
  }
  if (typeof state.deploymentId !== 'string' || !state.deploymentId.startsWith('dpl_')) {
    throw new Error('production_verified release state is missing a valid Vercel deployment id');
  }
  return state;
}

export function writeReleaseState(path, value) {
  if (!path) return;
  mkdirSync(dirname(path), { recursive: true });
  const next = {
    schemaVersion: 1,
    ...value,
    updatedAt: new Date().toISOString(),
  };
  const temporaryPath = `${path}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporaryPath, path);
}
