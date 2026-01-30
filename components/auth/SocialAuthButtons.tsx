'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAuth, OAuthProvider } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface SocialAuthButtonsProps {
  onError?: (error: string) => void;
  onStartAuth?: () => void;
  className?: string;
  disabled?: boolean;
}

export function SocialAuthButtons({
  onError,
  onStartAuth,
  className,
  disabled = false,
}: SocialAuthButtonsProps) {
  const { signInWithOAuth } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    if (disabled || loadingProvider) return;
    
    setLoadingProvider(provider);
    onStartAuth?.();

    try {
      const { error } = await signInWithOAuth(provider);
      if (error) {
        const errorMessage = getErrorMessage(error.message, provider);
        onError?.(errorMessage);
        setLoadingProvider(null);
      }
      // Note: On success, the page redirects, so we don't reset loading state
    } catch {
      onError?.('Ein unerwarteter Fehler ist aufgetreten');
      setLoadingProvider(null);
    }
  };

  const getErrorMessage = (message: string, provider: OAuthProvider): string => {
    const providerName = provider === 'google' ? 'Google' : 'Apple';
    
    if (message.includes('popup_closed')) {
      return `${providerName}-Anmeldung abgebrochen`;
    }
    if (message.includes('access_denied')) {
      return `Zugriff verweigert. Bitte erneut versuchen.`;
    }
    if (message.includes('already registered')) {
      return 'Diese E-Mail ist bereits mit einem anderen Konto registriert';
    }
    return `${providerName}-Anmeldung fehlgeschlagen`;
  };

  const isLoading = loadingProvider !== null;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Google Button */}
      <motion.button
        type="button"
        onClick={() => handleOAuthLogin('google')}
        disabled={disabled || isLoading}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        className={cn(
          "w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
          "bg-white text-gray-800 hover:bg-gray-100",
          "border border-gray-200",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {loadingProvider === 'google' ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        <span>Mit Google fortfahren</span>
      </motion.button>

      {/* Apple Button */}
      <motion.button
        type="button"
        onClick={() => handleOAuthLogin('apple')}
        disabled={disabled || isLoading}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        className={cn(
          "w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
          "bg-black text-white hover:bg-gray-900",
          "border border-gray-800",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {loadingProvider === 'apple' ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <AppleIcon />
        )}
        <span>Mit Apple fortfahren</span>
      </motion.button>
    </div>
  );
}

// Google Logo SVG
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// Apple Logo SVG
function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

// Divider component for use between social and email forms
export function AuthDivider({ text = "oder" }: { text?: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/10" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-background text-muted-foreground">{text}</span>
      </div>
    </div>
  );
}
