/**
 * Native Auth Helpers für Capacitor Apps
 * 
 * Handhabt Deep Links und plattformspezifische Auth-Flows
 */

import { Capacitor } from '@capacitor/core';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

// Auth Callback URL basierend auf Plattform
export function getAuthRedirectUrl(): string {
  if (Capacitor.isNativePlatform()) {
    // Native: Custom URL Scheme
    return 'stax://auth/callback';
  }
  
  // Web: Normale HTTPS URL
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }
  
  return '/auth/callback';
}

/**
 * Registriert Deep Link Listener für Auth-Callbacks
 * Sollte einmal beim App-Start aufgerufen werden
 */
export async function setupNativeAuthListener(
  onAuthComplete?: (success: boolean) => void
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return; // Nur für native Apps
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  // Deep Link Listener
  await App.addListener('appUrlOpen', async (event: URLOpenListenerEvent) => {
    const url = event.url;
    
    // Prüfe ob es ein Auth-Callback ist
    if (url.includes('auth/callback') || url.includes('stax://auth')) {
      try {
        // Extrahiere den Auth-Code aus der URL
        const urlObj = new URL(url.replace('stax://', 'https://placeholder.com/'));
        const code = urlObj.searchParams.get('code');
        
        if (code) {
          // Tausche Code gegen Session
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Auth callback error:', error);
            onAuthComplete?.(false);
          } else {
            onAuthComplete?.(true);
          }
        }
      } catch (error) {
        console.error('Failed to process auth callback:', error);
        onAuthComplete?.(false);
      }
    }
  });
}

/**
 * Entfernt Deep Link Listener (z.B. bei Cleanup)
 */
export async function removeNativeAuthListener(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await App.removeAllListeners();
}

/**
 * Prüft ob die App auf einer nativen Plattform läuft
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Gibt die aktuelle Plattform zurück
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
}

/**
 * Native-spezifische Cookie/Consent Prüfung
 * 
 * In nativen Apps sind HTTP-Cookies weniger relevant,
 * aber wir brauchen trotzdem Einwilligung für:
 * - Gesundheitsdatenverarbeitung (Art. 9 DSGVO)
 * - Lokale Datenspeicherung
 */
export function shouldShowNativeConsent(): boolean {
  if (!Capacitor.isNativePlatform()) {
    return false; // Web nutzt Cookie-Banner
  }
  
  // Prüfe ob Consent bereits erteilt wurde
  const consent = localStorage.getItem('stax_native_consent');
  return !consent;
}

export function setNativeConsent(granted: boolean): void {
  localStorage.setItem('stax_native_consent', JSON.stringify({
    granted,
    timestamp: new Date().toISOString(),
    platform: getPlatform(),
  }));
}
