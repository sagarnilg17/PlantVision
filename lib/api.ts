'use client';

import { supabase } from './supabase';

// When bundled into the native app the UI is served locally (capacitor://localhost),
// so API calls must target the deployed server by absolute URL. On the web this is
// empty and calls stay same-origin. Set NEXT_PUBLIC_API_BASE_URL for the native build.
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

/**
 * POST JSON to an internal API route, attaching the current Supabase access token
 * as a Bearer header. Cookies don't flow cross-origin from the bundled app, so the
 * token is how the server authenticates the request.
 */
export async function apiFetch(path: string, body: unknown): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}
