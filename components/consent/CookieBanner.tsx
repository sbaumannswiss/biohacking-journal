'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const CONSENT_KEY = 'stax_cookie_consent';
const CONSENT_VERSION = '1.0'; // Bump when privacy policy changes

interface ConsentState {
  necessary: boolean; // Always true
  analytics: boolean;
  version: string;
  timestamp: string;
}

/**
 * DSGVO-konformer Cookie-Banner
 * 
 * Da die App nur technisch notwendige Cookies verwendet (Supabase Auth),
 * ist dies ein vereinfachter Banner. Bei Erweiterung um Analytics
 * müssen zusätzliche Optionen angeboten werden.
 */
export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Prüfe ob Einwilligung bereits erteilt wurde
    const stored = localStorage.getItem(CONSENT_KEY);
    
    if (stored) {
      try {
        const consent: ConsentState = JSON.parse(stored);
        // Prüfe Version - bei neuer Version erneut fragen
        if (consent.version !== CONSENT_VERSION) {
          setShowBanner(true);
        }
      } catch {
        setShowBanner(true);
      }
    } else {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = (includeAnalytics: boolean = false) => {
    const consent: ConsentState = {
      necessary: true,
      analytics: includeAnalytics,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    setShowBanner(false);
  };

  const handleAcceptNecessary = () => {
    handleAccept(false);
  };

  const handleAcceptAll = () => {
    handleAccept(true);
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
      >
        <div className="max-w-lg mx-auto bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-6">
            <h3 className="text-lg font-bold mb-2">Cookie-Einstellungen</h3>
            
            <p className="text-sm text-muted-foreground mb-4">
              Wir verwenden nur technisch notwendige Cookies für die Anmeldung und 
              Funktionalität der App. Keine Tracking-Cookies, keine Werbung.
            </p>

            {/* Details Toggle */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-primary hover:underline mb-4"
            >
              {showDetails ? 'Details ausblenden' : 'Details anzeigen'}
            </button>

            {/* Cookie Details */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="space-y-3 p-3 bg-muted/30 rounded-lg text-sm">
                    {/* Notwendige Cookies */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled
                        className="mt-1 w-4 h-4"
                      />
                      <div>
                        <p className="font-medium">Notwendige Cookies</p>
                        <p className="text-muted-foreground text-xs">
                          Authentifizierung und Session-Verwaltung (Supabase Auth).
                          Ohne diese funktioniert die App nicht.
                        </p>
                      </div>
                    </div>

                    {/* Analyse Cookies (derzeit nicht verwendet) */}
                    <div className="flex items-start gap-3 opacity-50">
                      <input
                        type="checkbox"
                        checked={false}
                        disabled
                        className="mt-1 w-4 h-4"
                      />
                      <div>
                        <p className="font-medium">Analyse-Cookies</p>
                        <p className="text-muted-foreground text-xs">
                          Derzeit nicht verwendet. Wir tracken dich nicht.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAcceptNecessary}
                className="flex-1 py-3 px-4 bg-muted hover:bg-muted/80 rounded-xl font-medium transition-colors"
              >
                Nur Notwendige
              </button>
              <button
                onClick={handleAcceptAll}
                className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Akzeptieren
              </button>
            </div>

            {/* Privacy Link */}
            <p className="mt-4 text-xs text-center text-muted-foreground">
              Mehr Infos in unserer{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Datenschutzerklärung
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Hook um Consent-Status zu prüfen
 */
export function useConsent() {
  const [consent, setConsent] = useState<ConsentState | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        setConsent(JSON.parse(stored));
      } catch {
        setConsent(null);
      }
    }
  }, []);

  return {
    hasConsent: !!consent,
    consent,
    hasAnalyticsConsent: consent?.analytics ?? false,
  };
}
