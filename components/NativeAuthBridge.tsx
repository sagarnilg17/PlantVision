'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// The deep link Supabase redirects back to after Google OAuth in the native app.
// Must also be added to Supabase → Auth → URL Configuration → Redirect URLs.
export const NATIVE_OAUTH_REDIRECT = 'com.maali.app://login-callback';

/**
 * Native-only bridge. Handles two Android concerns and is a no-op on the web:
 *  1. Completes OAuth when the browser redirects back via the custom-scheme deep link.
 *  2. Maps the hardware/gesture Back button to web-history navigation (exits only
 *     at the root), instead of Capacitor's default of quitting from any screen.
 */
export function NativeAuthBridge() {
  useEffect(() => {
    const removers: Array<() => void> = [];
    let cancelled = false;

    (async () => {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform() || cancelled) return;

      const { App } = await import('@capacitor/app');

      const oauth = await App.addListener('appUrlOpen', async ({ url }) => {
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
      removers.push(() => oauth.remove());

      const back = await App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack || window.history.length > 1) window.history.back();
        else App.exitApp();
      });
      removers.push(() => back.remove());
    })();

    return () => { cancelled = true; removers.forEach(r => r()); };
  }, []);

  return null;
}
