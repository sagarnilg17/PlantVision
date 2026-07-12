'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// The deep link Supabase redirects back to after Google OAuth in the native app.
// Must also be added to Supabase → Auth → URL Configuration → Redirect URLs.
export const NATIVE_OAUTH_REDIRECT = 'com.plantvision.app://login-callback';

/**
 * Native-only: completes the OAuth flow when the browser redirects back into the
 * app via the custom-scheme deep link. No-op on the web.
 */
export function NativeAuthBridge() {
  useEffect(() => {
    let remove: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform() || cancelled) return;

      const { App } = await import('@capacitor/app');
      const handle = await App.addListener('appUrlOpen', async ({ url }) => {
        if (!url.startsWith(NATIVE_OAUTH_REDIRECT)) return;
        try {
          const code = new URL(url).searchParams.get('code');
          if (!code) return;
          await supabase.auth.exchangeCodeForSession(code);
          try {
            const { Browser } = await import('@capacitor/browser');
            await Browser.close();
          } catch { /* browser may already be closed */ }
          window.location.href = '/';
        } catch { /* malformed callback — ignore */ }
      });
      remove = () => handle.remove();
    })();

    return () => { cancelled = true; remove?.(); };
  }, []);

  return null;
}
