'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key'
    );
  }
  return client;
}

// Proxy so `supabase.auth...` works but the client is only built on first real use (browser runtime)
export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const c = getClient();
    const v = c[prop as keyof SupabaseClient];
    return typeof v === 'function' ? v.bind(c) : v;
  },
});
