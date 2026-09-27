import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// SECRET — server-only. Bypasses Row Level Security entirely.
// Used only inside API routes, never imported into client components.
// Requires SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix) in your env vars.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
