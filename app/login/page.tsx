'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { NATIVE_OAUTH_REDIRECT } from '@/components/NativeAuthBridge';
import { T } from '@/lib/theme';

function PlantMark() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      {/* outer glow ring */}
      <circle cx="32" cy="32" r="30" fill="rgba(255,255,255,0.10)" />
      {/* leaf body */}
      <path d="M32 10 C32 10, 16 24, 16 38 C16 47.3 23.2 54 32 54 C40.8 54 48 47.3 48 38 C48 24 32 10 32 10Z" fill="rgba(255,255,255,0.92)" />
      {/* stem */}
      <line x1="32" y1="22" x2="32" y2="54" stroke="rgba(27,94,32,0.5)" strokeWidth="1.5" strokeLinecap="round" />
      {/* left vein */}
      <path d="M32 31 C32 31, 24 27, 22 33" stroke="rgba(27,94,32,0.4)" strokeWidth="1" strokeLinecap="round" fill="none" />
      {/* right vein */}
      <path d="M32 39 C32 39, 40 35, 42 41" stroke="rgba(27,94,32,0.4)" strokeWidth="1" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email,   setEmail]   = useState('');
  const [otp,     setOtp]     = useState('');
  const [step,    setStep]    = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const signInWithGoogle = async () => {
    setLoading(true); setError(null);

    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      // Native: open the OAuth page in the system browser and return via deep link.
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: NATIVE_OAUTH_REDIRECT, skipBrowserRedirect: true },
      });
      if (error || !data?.url) {
        setError(error?.message ?? 'Could not start Google sign-in');
        setLoading(false);
        return;
      }
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url: data.url });
      // Session completes in NativeAuthBridge via the appUrlOpen deep link.
      return;
    }

    // Web: redirect to the /auth/callback route handler.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setLoading(false); }
    // on success the browser navigates away — no setLoading(false) needed
  };

  const sendOtp = async () => {
    setLoading(true); setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
      setLoading(false);
      if (error) { setError(error.message || 'Auth error'); return; }
      setStep('otp');
    } catch (e: unknown) {
      setLoading(false);
      setError(e instanceof Error ? e.message : 'Could not reach server — check your connection.');
    }
  };

  const verifyOtp = async () => {
    setLoading(true); setError(null);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: otp, type: 'email' });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push('/');
  };

  const canSubmitEmail = email.includes('@') && !loading;
  const canSubmitOtp   = otp.length === 6 && !loading;

  return (
    <main style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column' }}>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(155deg, #2E7D32 0%, #1B5E20 60%, #14461A 100%)`,
        minHeight: 280,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
        padding: '56px 24px 52px',
        position: 'relative', overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{ marginBottom: 16 }}><PlantMark /></div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: '#fff', margin: '0 0 8px', letterSpacing: -0.5 }}>Plant Care</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.68)', margin: 0, lineHeight: 1.5 }}>
            {step === 'email' ? 'Identify, track and care for your plants' : `Check ${email}`}
          </p>
        </div>
      </div>

      {/* Form sheet */}
      <div style={{
        flex: 1,
        background: T.surface,
        borderRadius: `${T.rSheet} ${T.rSheet} 0 0`,
        marginTop: -22,
        padding: '32px 24px 40px',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -6px 24px rgba(0,0,0,0.07)',
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: '0 0 6px' }}>
          {step === 'email' ? 'Sign in' : 'Enter your code'}
        </h2>
        <p style={{ fontSize: 14, color: T.sub, margin: '0 0 28px', lineHeight: 1.5 }}>
          {step === 'email'
            ? "We'll send a one-time code — no password needed."
            : `Sent to ${email}`}
        </p>

        {step === 'email' ? (
          <>
            {/* Google sign-in */}
            <button onClick={signInWithGoogle} disabled={loading}
              style={{
                width: '100%', padding: '13px 16px', fontSize: 15, fontWeight: 600,
                background: '#fff', color: '#3c4043',
                border: `1.5px solid #dadce0`, borderRadius: T.rSm,
                cursor: loading ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                marginBottom: 20,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                transition: 'box-shadow 0.15s',
              }}>
              {/* Google "G" logo */}
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span style={{ fontSize: 12, color: T.muted }}>or use email</span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>

            <label htmlFor="login-email" style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, display: 'block' }}>
              Email address
            </label>
            <input
              id="login-email"
              type="email" placeholder="you@example.com" autoFocus
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canSubmitEmail && sendOtp()}
              style={{
                width: '100%', padding: '14px 16px', fontSize: 16,
                borderRadius: T.rSm, border: `1.5px solid ${T.border}`,
                background: T.bg, color: T.text, outline: 'none',
                marginBottom: 16, display: 'block',
              }}
            />
            <button onClick={sendOtp} disabled={!canSubmitEmail}
              style={{
                width: '100%', padding: 15, fontSize: 15, fontWeight: 600,
                background: canSubmitEmail ? T.green : T.greenLight,
                color: canSubmitEmail ? '#fff' : T.muted,
                border: 'none', borderRadius: T.rSm,
                cursor: canSubmitEmail ? 'pointer' : 'default',
                transition: 'background 0.2s, color 0.2s',
              }}>
              {loading ? 'Sending…' : 'Continue with email'}
            </button>
          </>
        ) : (
          <>
            <label htmlFor="login-otp" style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, display: 'block' }}>
              6-digit code
            </label>
            <input
              id="login-otp"
              type="text" inputMode="numeric" placeholder="000000" autoFocus autoComplete="one-time-code"
              value={otp} onChange={e => setOtp(e.target.value)} maxLength={6}
              onKeyDown={e => e.key === 'Enter' && canSubmitOtp && verifyOtp()}
              style={{
                width: '100%', padding: '14px 16px', fontSize: 24, letterSpacing: 10,
                borderRadius: T.rSm, border: `1.5px solid ${T.border}`,
                background: T.bg, color: T.text, outline: 'none',
                marginBottom: 16, display: 'block', textAlign: 'center',
              }}
            />
            <button onClick={verifyOtp} disabled={!canSubmitOtp}
              style={{
                width: '100%', padding: 15, fontSize: 15, fontWeight: 600,
                background: canSubmitOtp ? T.green : T.greenLight,
                color: canSubmitOtp ? '#fff' : T.muted,
                border: 'none', borderRadius: T.rSm,
                cursor: canSubmitOtp ? 'pointer' : 'default',
                marginBottom: 8,
                transition: 'background 0.2s, color 0.2s',
              }}>
              {loading ? 'Verifying…' : 'Sign In'}
            </button>
            <button onClick={() => { setStep('email'); setOtp(''); setError(null); }}
              style={{ width: '100%', padding: 12, background: 'none', border: 'none', color: T.sub, fontSize: 14, cursor: 'pointer' }}>
              ← Use a different email
            </button>
          </>
        )}

        {error && (
          <div role="alert" style={{ marginTop: 14, padding: '12px 14px', background: T.dangerLight, border: `1px solid ${T.dangerBorder}`, borderRadius: T.rSm, color: T.danger, fontSize: 14 }}>
            {error}
          </div>
        )}

        <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', marginTop: 'auto', paddingTop: 36 }}>
          No password · Secure magic link sign-in
        </p>
      </div>
    </main>
  );
}
