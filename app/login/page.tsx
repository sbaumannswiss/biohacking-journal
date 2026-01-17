'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type AuthMode = 'login' | 'signup' | 'magic-link' | 'forgot-password';

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedHealthData, setAcceptedHealthData] = useState(false);

  const { signIn, signUp, signInWithMagicLink, resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          setError(getErrorMessage(error.message));
        } else {
          router.push(redirectTo);
          router.refresh();
        }
      } else if (mode === 'signup') {
        if (!acceptedPrivacy) {
          setError('Bitte akzeptiere die Datenschutzerklärung');
          setIsSubmitting(false);
          return;
        }
        if (!acceptedHealthData) {
          setError('Bitte stimme der Verarbeitung deiner Gesundheitsdaten zu');
          setIsSubmitting(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwörter stimmen nicht überein');
          setIsSubmitting(false);
          return;
        }
        if (password.length < 8) {
          setError('Passwort muss mindestens 8 Zeichen haben');
          setIsSubmitting(false);
          return;
        }
        const { error } = await signUp(email, password);
        if (error) {
          setError(getErrorMessage(error.message));
        } else {
          setSuccess('Bestätigungslink wurde an deine E-Mail gesendet. Bitte überprüfe dein Postfach.');
        }
      } else if (mode === 'magic-link') {
        const { error } = await signInWithMagicLink(email);
        if (error) {
          setError(getErrorMessage(error.message));
        } else {
          setSuccess('Magic Link wurde an deine E-Mail gesendet');
        }
      } else if (mode === 'forgot-password') {
        const { error } = await resetPassword(email);
        if (error) {
          setError(getErrorMessage(error.message));
        } else {
          setSuccess('Link zum Zurücksetzen wurde an deine E-Mail gesendet');
        }
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getErrorMessage = (message: string): string => {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Ungültige Anmeldedaten',
      'Email not confirmed': 'E-Mail noch nicht bestätigt',
      'User already registered': 'E-Mail bereits registriert',
      'Password should be at least 6 characters': 'Passwort zu kurz',
      'Email rate limit exceeded': 'Zu viele Anfragen, bitte warte kurz',
    };
    return errorMap[message] || message;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            STAX
          </h1>
          <p className="text-muted-foreground mt-2">
            Dein persönlicher Performance-Begleiter
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
          {/* Header */}
          <h2 className="text-xl font-bold mb-6 text-center">
            {mode === 'login' && 'Willkommen zurück'}
            {mode === 'signup' && 'Konto erstellen'}
            {mode === 'magic-link' && 'Magic Link Login'}
            {mode === 'forgot-password' && 'Passwort zurücksetzen'}
          </h2>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="deine@email.de"
                required
                autoComplete="email"
              />
            </div>

            {(mode === 'login' || mode === 'signup') && (
              <div>
                <label className="block text-sm font-medium mb-2">Passwort</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
            )}

            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Passwort bestätigen</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>

                {/* DSGVO Checkboxen */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedPrivacy}
                      onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-border accent-primary"
                    />
                    <span className="text-sm text-muted-foreground">
                      Ich akzeptiere die{' '}
                      <Link href="/privacy" className="text-primary underline" target="_blank">
                        Datenschutzerklärung
                      </Link>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedHealthData}
                      onChange={(e) => setAcceptedHealthData(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-border accent-primary"
                    />
                    <span className="text-sm text-muted-foreground">
                      Ich stimme der Verarbeitung meiner Gesundheitsdaten gemäß Art. 9 DSGVO zu
                    </span>
                  </label>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Wird verarbeitet...
                </span>
              ) : (
                <>
                  {mode === 'login' && 'Anmelden'}
                  {mode === 'signup' && 'Registrieren'}
                  {mode === 'magic-link' && 'Link senden'}
                  {mode === 'forgot-password' && 'Link senden'}
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-6 pt-6 border-t border-border space-y-3">
            {mode === 'login' && (
              <>
                <button
                  onClick={() => setMode('signup')}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Noch kein Konto? <span className="text-primary font-medium">Registrieren</span>
                </button>
                <button
                  onClick={() => setMode('magic-link')}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Lieber per Magic Link anmelden
                </button>
                <button
                  onClick={() => setMode('forgot-password')}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Passwort vergessen?
                </button>
              </>
            )}
            {mode === 'signup' && (
              <button
                onClick={() => setMode('login')}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Bereits ein Konto? <span className="text-primary font-medium">Anmelden</span>
              </button>
            )}
            {(mode === 'magic-link' || mode === 'forgot-password') && (
              <button
                onClick={() => setMode('login')}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Zurück zur Anmeldung
              </button>
            )}
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Datenschutz
          </Link>
          <span className="mx-2">•</span>
          <Link href="/waitlist" className="hover:text-foreground transition-colors">
            Waitlist
          </Link>
        </div>
      </div>
    </div>
  );
}
