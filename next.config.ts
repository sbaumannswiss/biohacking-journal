import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export' entfernt - API-Routen brauchen einen Server
  // Für Capacitor-Build später: separate Konfiguration verwenden
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
