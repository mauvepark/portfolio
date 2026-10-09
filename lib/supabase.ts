import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let browserClient: SupabaseClient | undefined;

/** Public client: reads approved rows and subscribes to realtime. Safe in the browser. */
export function supabasePublic() {
  browserClient ??= createClient(url, anonKey, { auth: { persistSession: false } });
  return browserClient;
}
