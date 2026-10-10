import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | undefined;

/**
 * Browser client for /admin only: keeps the signed-in session in localStorage and reads it
 * from the magic link's URL fragment on arrival. (The public client never persists sessions.)
 */
export function supabaseAuth() {
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: true, detectSessionInUrl: true, flowType: 'implicit', storageKey: 'noor-admin-auth' },
  });
  return client;
}
