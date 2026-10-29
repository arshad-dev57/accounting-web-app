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
    )
      .trim()
      .replace(/\/+$/, '');
    return [
      {
        // Multipart preview + JSON confirm use App Router proxies (see app/api/bank-reconciliation/import/*).
        // Keep App Router handlers for sales-invoices/* (dynamic [id] was wrongly
        // proxied to Express /api/sales-invoices/:id which does not exist → HTML 404).
        source:
          '/api/:path((?!pos/|download/|hr/holidays|hr/shifts|warehouse/inventory/import|bank-reconciliation/import|sales-invoices).*)',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      { source: '/import', destination: '/import/dashboard', permanent: false },
      { source: '/export', destination: '/export/dashboard', permanent: false },
      { source: '/trading', destination: '/trading/dashboard', permanent: false },
      { source: '/manufacturing', destination: '/manufacturing/manufacturing', permanent: false },
      { source: '/manufacturing/dashboard', destination: '/manufacturing/manufacturing/dashboard', permanent: false },
      { source: '/manufacturing/master/bom', destination: '/manufacturing/manufacturing/bom', permanent: false },
      { source: '/manufacturing/master/bom-versions', destination: '/manufacturing/manufacturing/bom', permanent: false },
      { source: '/manufacturing/master/routings', destination: '/manufacturing/manufacturing/routing', permanent: false },
      { source: '/manufacturing/master/operations', destination: '/manufacturing/manufacturing/operation', permanent: false },
      { source: '/manufacturing/master/work-centers', destination: '/manufacturing/manufacturing/workstation', permanent: false },
      { source: '/manufacturing/master/machines', destination: '/manufacturing/manufacturing/workstation', permanent: false },
      { source: '/manufacturing/production/orders', destination: '/manufacturing/manufacturing/work-order', permanent: false },
      { source: '/manufacturing/production/work-orders', destination: '/manufacturing/manufacturing/job-card', permanent: false },
      { source: '/manufacturing/production/shop-floor', destination: '/manufacturing/manufacturing/job-card', permanent: false },
      { source: '/manufacturing/production/tracking', destination: '/manufacturing/manufacturing/work-order', permanent: false },
      { source: '/manufacturing/planning/mps', destination: '/manufacturing/manufacturing/master-production-schedule', permanent: false },
      { source: '/manufacturing/planning/demand', destination: '/manufacturing/manufacturing/production-plan', permanent: false },
      { source: '/manufacturing/planning/mrp', destination: '/manufacturing/manufacturing/production-plan', permanent: false },
      { source: '/manufacturing/planning/shortage', destination: '/manufacturing/manufacturing', permanent: false },
      { source: '/manufacturing/materials/:path*', destination: '/manufacturing/manufacturing', permanent: false },
      { source: '/manufacturing/quality/:path*', destination: '/manufacturing/manufacturing', permanent: false },
      { source: '/manufacturing/maintenance/:path*', destination: '/manufacturing/manufacturing', permanent: false },
      { source: '/manufacturing/subcontracting/:path*', destination: '/manufacturing/manufacturing', permanent: false },
      { source: '/manufacturing/costing', destination: '/manufacturing/manufacturing', permanent: false },
      { source: '/manufacturing/costing/:path*', destination: '/manufacturing/manufacturing', permanent: false },
      { source: '/manufacturing/reports', destination: '/manufacturing/manufacturing', permanent: false },
      { source: '/manufacturing/guide', destination: '/manufacturing/manufacturing', permanent: false },
      { source: '/manufacturing/settings', destination: '/manufacturing/manufacturing/manufacturing-settings', permanent: false },
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