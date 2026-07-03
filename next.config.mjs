/** @type {import('next').NextConfig} */
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
const nextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: {
    cpus: 4,
    staticGenerationMaxConcurrency: 4,
    staticGenerationMinPagesPerWorker: 10,
  },
  ...(basePath ? { basePath, assetPrefix: `${basePath}/` } : {}),
};
export default nextConfig;
