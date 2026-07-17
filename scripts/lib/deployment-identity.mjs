function deploymentHost(value) {
  if (typeof value !== 'string' || value.length === 0) return '';
  try {
    return new URL(value.includes('://') ? value : `https://${value}`).host.toLowerCase();
  } catch {
    return '';
  }
}

function parseJson(output, label) {
  try {
    return JSON.parse(output);
  } catch {
    throw new Error(`${label} did not return valid JSON`);
  }
}

function validateOwnedReadyDeployment(inspection, { orgId, project, projectId }) {
  if (inspection.name !== project) {
    throw new Error(`Vercel deployment belongs to project ${inspection.name || 'unknown'}, expected ${project}`);
  }
  if (inspection.projectId !== projectId) {
    throw new Error('Vercel deployment project id does not match the linked canonical project');
  }
  if (inspection.ownerId !== orgId) {
    throw new Error('Vercel deployment owner does not match the linked canonical scope');
  }
  if (inspection.readyState !== 'READY') {
    throw new Error(`Vercel deployment is ${inspection.readyState || 'unknown'}, expected READY`);
  }
  if (typeof inspection.id !== 'string' || !inspection.id.startsWith('dpl_')) {
    throw new Error('Vercel deployment is missing a valid deployment id');
  }
  if (!deploymentHost(inspection.url).endsWith('.vercel.app')) {
    throw new Error('Vercel deployment is missing a valid deployment URL');
  }
}

export function validateDeploymentIdentity(
  inspectionOutput,
  { commit, deploymentUrl, orgId, project, projectId }
) {
  const inspection = parseJson(inspectionOutput, 'Vercel deployment API');

  const expectedHost = deploymentHost(deploymentUrl);
  const inspectedHost = deploymentHost(inspection.url);
  if (!expectedHost || inspectedHost !== expectedHost) {
    throw new Error('Vercel deployment URL does not match the staged release state');
  }
  validateOwnedReadyDeployment(inspection, { orgId, project, projectId });
  if (inspection.meta?.gitCommitSha !== commit) {
    throw new Error('Vercel deployment commit metadata does not match the release commit');
  }

  return {
    deploymentId: inspection.id,
    deploymentUrl: `https://${inspectedHost}`,
  };
}

export function validateProductionDeploymentIdentity(
  inspectionOutput,
  { orgId, project, projectId }
) {
  const inspection = parseJson(inspectionOutput, 'Vercel production deployment API');
  validateOwnedReadyDeployment(inspection, { orgId, project, projectId });
  return {
    commit: typeof inspection.meta?.gitCommitSha === 'string'
      ? inspection.meta.gitCommitSha
      : null,
    deploymentId: inspection.id,
    deploymentUrl: `https://${deploymentHost(inspection.url)}`,
  };
}

export function reusableDeploymentFromList(listOutput, { commit, project }) {
  const response = parseJson(listOutput, 'Vercel deployment list API');
  if (!Array.isArray(response.deployments)) {
    throw new Error('Vercel deployment list API is missing deployments');
  }
  const reusableStates = new Set(['BUILDING', 'INITIALIZING', 'QUEUED', 'READY']);
  const candidates = response.deployments
    .filter((deployment) => (
      deployment.name === project
      && deployment.meta?.gitCommitSha === commit
      && reusableStates.has(deployment.readyState ?? deployment.state)
      && typeof deployment.uid === 'string'
      && deployment.uid.startsWith('dpl_')
      && deploymentHost(deployment.url).endsWith('.vercel.app')
    ));
  if (candidates.length === 0) return null;
  if (candidates.length > 1) {
    throw new Error(
      `Vercel returned multiple reusable deployments for ${project}@${commit}; refusing an ambiguous release resume`
    );
  }
  return {
    deploymentId: candidates[0].uid,
    deploymentUrl: `https://${deploymentHost(candidates[0].url)}`,
  };
}

export function validateLinkedProjectIdentity(linkedProject, expectedProject) {
  if (linkedProject?.projectName !== expectedProject) {
    throw new Error(`linked Vercel project is ${linkedProject?.projectName || 'unknown'}, expected ${expectedProject}`);
  }
  if (typeof linkedProject.projectId !== 'string' || !linkedProject.projectId.startsWith('prj_')) {
    throw new Error('linked Vercel project is missing a valid project id');
  }
  if (typeof linkedProject.orgId !== 'string' || !linkedProject.orgId.startsWith('team_')) {
    throw new Error('linked Vercel project is missing a valid organization id');
  }
  return {
    orgId: linkedProject.orgId,
    projectId: linkedProject.projectId,
  };
}
