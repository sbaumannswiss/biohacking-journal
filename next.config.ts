import type { NextConfig } from "next";

const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';

const nextConfig: NextConfig = {
  // Für Capacitor/Mobile Build: statischer Export
  ...(isCapacitorBuild ? {
    output: 'export',
    distDir: 'out',
    trailingSlash: true,
  } : {
    // Redirect root to waitinglist (nur für Web)
    async redirects() {
      return [
        {
          source: '/',
          destination: '/waitinglist',
          permanent: false,
        },
      ];
    },
  }),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
