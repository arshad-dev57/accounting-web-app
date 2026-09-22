import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  skipTrailingSlashRedirect: true,
  generateEtags: false,
  
  // ⚡ COMPILATION SPEED BOOST FOR HEAVY LIBRARIES
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'jspdf',
      'xlsx',
      'country-flag-icons',
    ],
  },

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
        source: '/api/:path((?!pos/|download/|hr/holidays|hr/shifts).*)',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      { source: '/manufacturing', destination: '/manufacturing/dashboard', permanent: false },
      { source: '/manufacturing/master/bom-versions', destination: '/manufacturing/master/bom', permanent: false },
      { source: '/manufacturing/master/operations', destination: '/manufacturing/master/routings', permanent: false },
      { source: '/manufacturing/production/shop-floor', destination: '/manufacturing/production/work-orders', permanent: false },
      { source: '/manufacturing/production/tracking', destination: '/manufacturing/production/orders', permanent: false },
      { source: '/manufacturing/materials/consumption', destination: '/manufacturing/materials/issues', permanent: false },
      { source: '/manufacturing/materials/wip', destination: '/manufacturing/dashboard', permanent: false },
      { source: '/manufacturing/quality/plans', destination: '/manufacturing/quality/inspections', permanent: false },
      { source: '/manufacturing/quality/defects', destination: '/manufacturing/quality/inspections', permanent: false },
      { source: '/manufacturing/quality/reports', destination: '/manufacturing/reports', permanent: false },
      { source: '/manufacturing/maintenance/preventive', destination: '/manufacturing/maintenance/requests', permanent: false },
      { source: '/manufacturing/maintenance/breakdown', destination: '/manufacturing/maintenance/requests', permanent: false },
      { source: '/manufacturing/maintenance/spare-parts', destination: '/manufacturing/master/machines', permanent: false },
      { source: '/manufacturing/subcontracting/materials-sent', destination: '/manufacturing/subcontracting/orders', permanent: false },
      { source: '/manufacturing/subcontracting/materials-received', destination: '/manufacturing/subcontracting/orders', permanent: false },
      { source: '/manufacturing/costing/product-cost', destination: '/manufacturing/costing', permanent: false },
      { source: '/manufacturing/costing/standard-cost', destination: '/manufacturing/costing', permanent: false },
      { source: '/manufacturing/costing/actual-cost', destination: '/manufacturing/costing', permanent: false },
      { source: '/manufacturing/costing/variance', destination: '/manufacturing/costing', permanent: false },
    ];
  },
  async headers() {
    // Only apply strict no-store in Production to avoid dev navigation block
    if (process.env.NODE_ENV === 'development') {
      return [];
    }
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