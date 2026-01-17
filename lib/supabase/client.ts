'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase Browser Client für Client-Komponenten
 * Verwendet SSR-kompatible Cookie-Verwaltung
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials missing');
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Singleton für häufige Verwendung
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}
