import {
  releaseNeedsProjectLink,
  releasePhaseForExecution,
} from './release-state.mjs';

function assertProductionBinding(identity, { commit, deploymentId }) {
  if (identity.deploymentId !== deploymentId) {
    throw new Error('production domain does not point to the verified staged deployment');
  }
  if (identity.commit !== commit) {
    throw new Error('production domain deployment does not match the release commit');
  }
}

export async function runReleaseOrchestrator({
  checkpoint,
  operations,
  productionUrl,
  resume = false,
  state,
}) {
  let phase = releasePhaseForExecution(state, { resume });
  let stagedUrl = state.deploymentUrl;
  let deploymentIdentity;
  let linkedIdentity;

  if (releaseNeedsProjectLink({ phase, resume })) {
    linkedIdentity = await operations.link();
  }

  if (phase === 'starting') {
    checkpoint('linked');
    phase = 'linked';
  }

  if (phase === 'linked') {
    const reusableDeployment = resume
      ? await operations.findExistingDeployment(linkedIdentity)
      : null;
    if (!reusableDeployment && resume && state.deploymentAttempted) {
      throw new Error(
        'a deployment was already attempted for this release but is not visible yet; refusing to create a duplicate deployment'
      );
    }
    if (reusableDeployment) {
      stagedUrl = reusableDeployment.deploymentUrl;
    } else {
      checkpoint('linked', { deploymentAttempted: true });
      stagedUrl = await operations.deploy();
    }
    if (!/^https:\/\/[^\s]+\.vercel\.app\/?$/.test(stagedUrl)) {
      throw new Error('Vercel did not return a valid staged deployment URL');
    }
    checkpoint('staged', {
      deploymentId: reusableDeployment?.deploymentId,
      deploymentUrl: stagedUrl,
    });
    phase = 'staged';
    deploymentIdentity = await operations.inspect(stagedUrl, linkedIdentity);
    checkpoint('staged', { ...deploymentIdentity, deploymentUrl: stagedUrl });
  } else if (!stagedUrl) {
    throw new Error(`release cannot resume from ${phase} without a staged deployment URL`);
  }

  if (['staged', 'staged_verified', 'promoted', 'production_verified'].includes(phase) && !deploymentIdentity) {
    deploymentIdentity = await operations.inspect(stagedUrl, linkedIdentity);
    if (state.deploymentId && state.deploymentId !== deploymentIdentity.deploymentId) {
      throw new Error('Vercel deployment id does not match the staged release state');
    }
    if (phase === 'production_verified' && !state.deploymentId) {
      throw new Error('production_verified release state is missing its staged deployment id');
    }
    if (phase !== 'production_verified') {
      checkpoint(phase, { ...deploymentIdentity, deploymentUrl: stagedUrl });
    }
  }

  if (phase === 'production_verified') {
    await operations.productionSmoke();
    const productionIdentity = await operations.productionIdentity(linkedIdentity);
    assertProductionBinding(productionIdentity, {
      commit: state.commit,
      deploymentId: deploymentIdentity.deploymentId,
    });
    return { alreadyVerified: true, deploymentUrl: stagedUrl, phase };
  }

  if (phase === 'staged') {
    const routeAttempts = await operations.stagedSmoke(stagedUrl);
    checkpoint('staged_verified', { deploymentUrl: stagedUrl, routeAttempts });
    phase = 'staged_verified';
  }

  if (phase === 'staged_verified') {
    let alreadyPromoted = false;
    if (resume) {
      const productionIdentity = await operations.productionIdentity(linkedIdentity);
      if (productionIdentity.deploymentId === deploymentIdentity.deploymentId) {
        assertProductionBinding(productionIdentity, {
          commit: state.commit,
          deploymentId: deploymentIdentity.deploymentId,
        });
        alreadyPromoted = true;
      }
    }
    if (!alreadyPromoted) await operations.promote(stagedUrl);
    checkpoint('promoted', { ...deploymentIdentity, deploymentUrl: stagedUrl });
    phase = 'promoted';
  }

  if (phase === 'promoted') {
    await operations.productionSmoke();
    const productionIdentity = await operations.productionIdentity(linkedIdentity);
    assertProductionBinding(productionIdentity, {
      commit: state.commit,
      deploymentId: deploymentIdentity.deploymentId,
    });
    checkpoint('production_verified', {
      ...deploymentIdentity,
      deploymentUrl: stagedUrl,
      productionUrl,
    });
    phase = 'production_verified';
  }

  return { alreadyVerified: false, deploymentUrl: stagedUrl, phase };
}
