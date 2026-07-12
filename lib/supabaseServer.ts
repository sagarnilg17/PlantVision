import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';
import type { User } from '@supabase/supabase-js';

/**
 * Resolve the authenticated user inside a route handler.
 *
 * Two paths, in order:
 *  1. `Authorization: Bearer <token>` — used by the bundled native app, whose
 *     cookies don't flow cross-origin to the deployed API.
 *  2. Session cookies — used by the same-origin web app (@supabase/ssr).
 *
 * Returns null when neither yields a valid session.
 */
export async function getServerUser(): Promise<User | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  // 1. Bearer token
  const authHeader = (await headers()).get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await sb.auth.getUser(token);
    if (!error && data.user) return data.user;
  }

  // 2. Session cookies
  const cookieStore = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}
