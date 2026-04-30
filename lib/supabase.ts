import { createClient } from '@supabase/supabase-js';

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars not set');
  return createClient(url, key);
}

export const supabase = {
  from: (table: string) => getSupabaseClient().from(table),
  auth: {
    signInWithPassword: (creds: any) => getSupabaseClient().auth.signInWithPassword(creds),
    signOut: () => getSupabaseClient().auth.signOut(),
    getSession: () => getSupabaseClient().auth.getSession(),
  },
  storage: {
    from: (bucket: string) => getSupabaseClient().storage.from(bucket),
  },
};

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service env vars not set');
  return createClient(url, key);
}
