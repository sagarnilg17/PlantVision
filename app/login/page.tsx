'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = async () => {
    setLoading(true); setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      });
      setLoading(false);
      if (error) { setError(error.message || 'Auth error'); return; }
      setStep('otp');
    } catch (e: unknown) {
      setLoading(false);
      setError(e instanceof Error ? e.message : 'Could not reach Supabase — check your env keys in Vercel.');
    }
  };

  const verifyOtp = async () => {
    setLoading(true); setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(), token: otp, type: 'email',
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push('/');
  };

  const input: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '14px 16px',
    fontSize: 16, borderRadius: 12, border: '1px solid #D5E5D5',
    background: '#FFFFFF', color: '#1A2E1A', outline: 'none', marginBottom: 12,
  };
  const btn: React.CSSProperties = {
    width: '100%', padding: 14, fontSize: 16, fontWeight: 600,
    background: '#2E7D32', color: '#FFFFFF', border: 'none',
    borderRadius: 12, cursor: 'pointer',
  };

  return (
    <main style={{ minHeight: '100vh', background: '#F7FBF7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48 }}>🌿</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1A2E1A', margin: '8px 0 4px' }}>Plant Care</h1>
          <p style={{ fontSize: 14, color: '#5A6B5A', margin: 0 }}>
            {step === 'email' ? 'Sign in with your email' : `Enter the code sent to ${email}`}
          </p>
        </div>

        {step === 'email' ? (
          <>
            <input style={input} type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} />
            <button style={{ ...btn, opacity: loading ? 0.6 : 1 }} onClick={sendOtp} disabled={loading || !email}>
              {loading ? 'Sending…' : 'Send Code'}
            </button>
          </>
        ) : (
          <>
            <input style={input} type="text" inputMode="numeric" placeholder="6-digit code"
              value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} />
            <button style={{ ...btn, opacity: loading ? 0.6 : 1 }} onClick={verifyOtp} disabled={loading || otp.length < 6}>
              {loading ? 'Verifying…' : 'Verify & Sign In'}
            </button>
            <button onClick={() => { setStep('email'); setOtp(''); }}
              style={{ width: '100%', padding: 12, marginTop: 8, background: 'none', border: 'none', color: '#2E7D32', fontSize: 14, cursor: 'pointer' }}>
              ← Change email
            </button>
          </>
        )}

        {error && (
          <p style={{ marginTop: 12, padding: 10, background: '#FDEDED', border: '1px solid #F5B5B5', borderRadius: 8, color: '#C0392B', fontSize: 13 }}>
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
