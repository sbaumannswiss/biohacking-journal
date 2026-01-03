import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Warnung wenn Credentials fehlen
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('⚠️ Supabase credentials missing! Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
}

// Erstelle Client nur wenn Credentials vorhanden
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey) 
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Helper um zu prüfen ob Supabase verfügbar ist
export function isSupabaseConfigured(): boolean {
    return supabase !== null;
}
