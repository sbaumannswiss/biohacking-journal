import type { NextConfig } from "next";

const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';

const nextConfig: NextConfig = {
  // Für Capacitor/Mobile Build: statischer Export
  // Für Web/Vercel: Server-seitige API-Routen
  ...(isCapacitorBuild && {
    output: 'export',
    distDir: 'out',
    trailingSlash: true,
  }),
  images: {
    unoptimized: true,
  },
  // API Base URL für mobile App - zeigt auf gehostete Version
  env: {
    NEXT_PUBLIC_API_BASE_URL: isCapacitorBuild 
      ? (process.env.NEXT_PUBLIC_VERCEL_URL 
          ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
          : 'https://bioboost.vercel.app') // TODO: Echte Vercel URL eintragen
      : '',
  },
};

export default nextConfig;
