import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  skipTrailingSlashRedirect: true,
  generateEtags: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    const backendUrl = (
      process.env.API_URL || 'https://account-backend-five.vercel.app'
    ).trim();
    return [
      {
        // Keep frontend route handlers (eg. POS, desktop download, HR module) local.
        // Everything else under /api is proxied to the backend.
        // NOTE: /api/hr must stay local — afterFiles rewrites run BEFORE dynamic
        // routes, so without this exclusion /api/hr/*/[id] requests would be
        // proxied to the backend instead of hitting the local route handlers.
        source: '/api/:path((?!pos/|download/|hr/).*)',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/downloads/:file*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
          { key: 'Content-Disposition', value: 'attachment' },
        ],
      },
      {
        source: '/((?!_next/static|_next/image).*)',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
    ];
  },
};

export default nextConfig;