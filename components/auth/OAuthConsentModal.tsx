'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Heart, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface OAuthConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  userEmail?: string;
  providerName?: string;
}

/**
 * Modal for DSGVO consent after OAuth signup
 * Required because OAuth users skip the regular signup form with consent checkboxes
 */
export function OAuthConsentModal({
  isOpen,
  onAccept,
  onDecline,
  userEmail,
  providerName = 'OAuth',
}: OAuthConsentModalProps) {
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedHealthData, setAcceptedHealthData] = useState(false);

  const canAccept = acceptedPrivacy && acceptedHealthData;

  const handleAccept = () => {
    if (canAccept) {
      // Store consent in localStorage to track OAuth users who consented
      localStorage.setItem('stax_oauth_consent', JSON.stringify({
        acceptedAt: new Date().toISOString(),
        email: userEmail,
        provider: providerName,
      }));
      onAccept();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-md bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-xl">
                <Shield size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Datenschutz & Einwilligung</h2>
                <p className="text-sm text-muted-foreground">
                  Bevor du STAX nutzen kannst
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Um STAX nutzen zu können, benötigen wir deine Einwilligung zur Datenverarbeitung 
              gemäß DSGVO.
            </p>

            {/* Privacy Policy Checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="w-5 h-5 rounded border-white/20 bg-white/10 text-primary focus:ring-primary focus:ring-offset-0"
                />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium">
                  Datenschutzerklärung akzeptieren
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Ich habe die{' '}
                  <Link 
                    href="/privacy" 
                    target="_blank"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Datenschutzerklärung
                    <ExternalLink size={10} />
                  </Link>{' '}
                  gelesen und akzeptiere sie.
                </p>
              </div>
            </label>

            {/* Health Data Consent Checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  checked={acceptedHealthData}
                  onChange={(e) => setAcceptedHealthData(e.target.checked)}
                  className="w-5 h-5 rounded border-white/20 bg-white/10 text-primary focus:ring-primary focus:ring-offset-0"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Heart size={14} className="text-red-400" />
                  <span className="text-sm font-medium">
                    Gesundheitsdaten-Einwilligung
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ich willige gemäß Art. 9 DSGVO in die Verarbeitung meiner 
                  Gesundheitsdaten (Supplements, Schlaf, Energie, etc.) ein.
                </p>
              </div>
            </label>

            {/* Info Text */}
            <p className="text-xs text-muted-foreground">
              Du kannst deine Einwilligung jederzeit widerrufen und deine Daten 
              in den Profileinstellungen exportieren oder löschen.
            </p>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 space-y-3">
            <button
              onClick={handleAccept}
              disabled={!canAccept}
              className={cn(
                "w-full py-3 rounded-xl font-semibold transition-all",
                canAccept
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-white/10 text-muted-foreground cursor-not-allowed"
              )}
            >
              Akzeptieren & Weiter
            </button>
            <button
              onClick={onDecline}
              className="w-full py-3 rounded-xl font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Check if OAuth consent has been given
 */
export function hasOAuthConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('stax_oauth_consent') !== null;
}

/**
 * Get OAuth consent data
 */
export function getOAuthConsent(): { acceptedAt: string; email: string; provider: string } | null {
  if (typeof window === 'undefined') return null;
  const consent = localStorage.getItem('stax_oauth_consent');
  if (!consent) return null;
  try {
    return JSON.parse(consent);
  } catch {
    return null;
  }
}
