export function githubRepositoryFromRemote(remoteUrl) {
  const httpsMatch = remoteUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/i);
  const sshMatch = remoteUrl.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i);
  const match = httpsMatch || sshMatch;
  if (!match) throw new Error('origin must be a github.com HTTPS or SSH repository URL');
  return { owner: match[1], repository: match[2] };
}

export function authenticatedGithubRemote(remoteUrl, username) {
  const { owner, repository } = githubRepositoryFromRemote(remoteUrl);
  if (!username || /[\s/@:]/.test(username)) throw new Error('GitHub username is invalid');
  return `https://${encodeURIComponent(username)}@github.com/${owner}/${repository}.git`;
}

export function requireGithubPushPermission(repositoryPayload) {
  if (repositoryPayload?.permissions?.push !== true) {
    throw new Error('the approved GitHub token does not have push permission for origin');
  }
}
