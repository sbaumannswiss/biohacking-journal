import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.getstax.app',
  appName: 'STAX',
  webDir: 'out',
  
  // Server-Konfiguration für Auth-Redirects
  server: {
    // In Produktion: eigene Domain
    // url: 'https://getstax.de',
    // Für lokale Entwicklung:
    // url: 'http://192.168.x.x:3000',
    androidScheme: 'https',
    iosScheme: 'https',
  },
  
  // Deep Links werden in AndroidManifest.xml / Info.plist konfiguriert
  // Scheme: stax://
};

export default config;
