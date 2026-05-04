/** @type {import('next').NextConfig} */
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] || '';
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
const isUserOrOrgPagesRepo = repositoryName.endsWith('.github.io');
const inferredBasePath = isGitHubActions && repositoryName && !isUserOrOrgPagesRepo ? `/${repositoryName}` : '';
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? inferredBasePath).replace(/\/$/, '');
const nextConfig = { output: 'export', trailingSlash: true, images: { unoptimized: true }, ...(basePath ? { basePath, assetPrefix: `${basePath}/` } : {}) };
export default nextConfig;
