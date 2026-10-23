/** @type {import('next').NextConfig} */
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
];
const nextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: {
    cpus: 1,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 10,
  },
  async headers() {
    const year = 'public, max-age=31536000, immutable';
    const day = 'public, max-age=604800, stale-while-revalidate=2592000';
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/vendor/:path*', headers: [{ key: 'Cache-Control', value: year }] },
      { source: '/site-logos/:path*', headers: [{ key: 'Cache-Control', value: year }] },
      { source: '/site-icons/:path*', headers: [{ key: 'Cache-Control', value: year }] },
      { source: '/papers/:path*', headers: [{ key: 'Cache-Control', value: day }] },
      { source: '/images/:path*', headers: [{ key: 'Cache-Control', value: day }] },
      { source: '/topics/:path*', headers: [{ key: 'Cache-Control', value: day }] },
      { source: '/readme/:path*', headers: [{ key: 'Cache-Control', value: day }] },
      { source: '/institutions/:path*', headers: [{ key: 'Cache-Control', value: day }] },
      { source: '/files/:path*', headers: [{ key: 'Cache-Control', value: day }] },
      { source: '/xinbaopedia-icon.png', headers: [{ key: 'Cache-Control', value: year }] },
      { source: '/xinbaopedia-icon.webp', headers: [{ key: 'Cache-Control', value: year }] },
      { source: '/okf/:path*', headers: [{ key: 'Cache-Control', value: day }] },
    ];
  },
  async redirects() {
    return [
      { source: '/publications', destination: '/wiki/Publications/', permanent: true },
      { source: '/publications/', destination: '/wiki/Publications/', permanent: true },
      { source: '/zh/publications', destination: '/wiki/Publications_zh/', permanent: true },
      { source: '/zh/publications/', destination: '/wiki/Publications_zh/', permanent: true },
    ];
  },
  ...(basePath ? { basePath, assetPrefix: `${basePath}/` } : {}),
};
export default nextConfig;
