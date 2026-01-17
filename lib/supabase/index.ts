// Re-export für einfachen Import
export { createClient as createBrowserClient, getSupabaseBrowserClient } from './client';
export { createClient as createServerClient } from './server';
export { updateSession } from './middleware';

// Legacy-Export für Abwärtskompatibilität
export { supabase, isSupabaseConfigured } from '../supabase';
