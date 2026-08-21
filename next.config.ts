import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Many client API service modules live under app/api/**/route.ts without
  // GET/POST handlers (they call the backend via rewrites). Next 16 typed-routes
  // flags those files during `next build` — ignore until services are moved to /lib.
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
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    ).trim();
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;