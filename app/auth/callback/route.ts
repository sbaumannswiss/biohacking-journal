import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Auth Callback Handler
 * Verarbeitet Magic Links und E-Mail-Bestätigungen
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
        // Erfolgreich authentifiziert
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Fehler - Redirect zu Login mit Error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
