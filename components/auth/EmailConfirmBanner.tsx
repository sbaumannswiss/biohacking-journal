'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, Loader2, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface EmailConfirmBannerProps {
  className?: string;
}

/**
 * Banner das angezeigt wird wenn der User seine E-Mail noch nicht bestätigt hat.
 * Ermöglicht das erneute Senden der Bestätigungs-E-Mail.
 */
export function EmailConfirmBanner({ className }: EmailConfirmBannerProps) {
  const { user, signInWithMagicLink } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  // Prüfe ob E-Mail bestätigt ist
  const isEmailConfirmed = user?.email_confirmed_at != null;

  // Nicht anzeigen wenn:
  // - Kein User eingeloggt
  // - E-Mail bereits bestätigt
  // - Banner wurde dismissed
  if (!user || isEmailConfirmed || isDismissed) {
    return null;
  }

  const handleResend = async () => {
    if (!user.email) return;
    
    setIsResending(true);
    setResendError(null);
    
    try {
      const { error } = await signInWithMagicLink(user.email);
      
      if (error) {
        setResendError('Fehler beim Senden. Bitte versuche es später erneut.');
      } else {
        setResendSuccess(true);
        // Nach 5 Sekunden Banner ausblenden
        setTimeout(() => setIsDismissed(true), 5000);
      }
    } catch {
      setResendError('Ein Fehler ist aufgetreten.');
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Speichere dass Banner dismissed wurde (nur für diese Session)
    sessionStorage.setItem('email_confirm_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 ${className}`}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
            <Mail size={18} className="text-amber-400" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {resendSuccess ? (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <Check size={16} />
                <span>Bestätigungs-E-Mail gesendet!</span>
              </div>
            ) : (
              <>
                <p className="text-sm text-foreground font-medium">
                  E-Mail noch nicht bestätigt
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Bitte bestätige deine E-Mail-Adresse für alle Funktionen.
                </p>
                
                {resendError && (
                  <p className="text-xs text-red-400 mt-1">{resendError}</p>
                )}
                
                <button
                  onClick={handleResend}
                  disabled={isResending}
                  className="mt-2 flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50"
                >
                  {isResending ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Wird gesendet...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={12} />
                      <span>Erneut senden</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
          
          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0"
            aria-label="Schließen"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
