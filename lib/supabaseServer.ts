import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';

/**
 * Resolve the authenticated user inside a route handler from the request cookies.
 * The browser client (@supabase/ssr) persists the session in cookies, which are
 * sent automatically on same-origin API calls — so no bearer token is needed.
 * Returns null when there is no valid session.
 */
export async function getServerUser(): Promise<User | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      // Route handlers only read the session here; nothing to persist back.
      setAll: () => {},
    },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}
