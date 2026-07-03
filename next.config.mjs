/** @type {import('next').NextConfig} */
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
const nextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: {
    cpus: 1,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 10,
  },
  ...(basePath ? { basePath, assetPrefix: `${basePath}/` } : {}),
};
export default nextConfig;
