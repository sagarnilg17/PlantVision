'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Nav } from '@/components/Nav';
import { T } from '@/lib/theme';

const SPRING = { type: 'spring' as const, stiffness: 340, damping: 36 };

const FEATURE_REQUEST_EMAIL = 'sagarnil.gx@gmail.com';

function buildFeatureRequestHref(userEmail: string | null) {
  const subject = 'Plant Care — Feature Request';
  const body = [
    'Hi Sagar,',
    '',
    'I have a feature idea for Plant Care!',
    '',
    'What I want to do:',
    '(describe the feature here)',
    '',
    'Why it would help me:',
    '(what problem does it solve?)',
    '',
    '—',
    `Sent from Plant Care${userEmail ? ` by ${userEmail}` : ''}`,
  ].join('\n');
  return `mailto:${FEATURE_REQUEST_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function Spinner({ size = 20 }: { size?: number }) {
  return <div style={{ width: size, height: size, border: `2px solid ${T.greenLight}`, borderTop: `2px solid ${T.green}`, borderRadius: '50%', animation: 'spin 0.75s linear infinite', flexShrink: 0 }} />;
}

export default function ProfilePage() {
  const router = useRouter();
  const [email,      setEmail]      = useState<string | null>(null);
  const [name,       setName]       = useState<string | null>(null);
  const [avatarUrl,  setAvatarUrl]  = useState<string | null>(null);
  const [plantCount, setPlantCount] = useState<number | null>(null);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      const u = data.user;
      setEmail(u.email ?? null);
      setName((u.user_metadata?.full_name as string) ?? (u.user_metadata?.name as string) ?? null);
      setAvatarUrl((u.user_metadata?.avatar_url as string) ?? null);
      if (u.created_at) {
        setMemberSince(new Date(u.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
      }
      const { count } = await supabase.from('plants').select('id', { count: 'exact', head: true }).eq('user_id', u.id);
      setPlantCount(count ?? 0);
      setLoading(false);
    });
  }, [router]);

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size={28} />
      </main>
    );
  }

  const initial = (name ?? email ?? '?')[0].toUpperCase();

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: T.bg, paddingBottom: 110 }}>

      {/* Header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '52px 20px 28px', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={SPRING}
          style={{
            width: 84, height: 84, borderRadius: '50%', margin: '0 auto 14px',
            background: avatarUrl ? 'none' : `linear-gradient(135deg, ${T.green}, ${T.greenDark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', boxShadow: T.shadowGreen,
          }}>
          {avatarUrl
            ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 34, fontWeight: 800, color: '#fff' }}>{initial}</span>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.05 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: '0 0 3px', letterSpacing: -0.3 }}>
            {name ?? 'My Profile'}
          </h1>
          <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>{email}</p>
        </motion.div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.1 }}
          style={{ display: 'flex', background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r, boxShadow: T.shadow, overflow: 'hidden' }}>
          <div style={{ flex: 1, padding: '16px 8px', textAlign: 'center', borderRight: `1px solid ${T.border}` }}>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.green }}>{plantCount ?? '—'}</p>
            <p style={{ margin: '2px 0 0', fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>Plants</p>
          </div>
          <div style={{ flex: 1.6, padding: '16px 8px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text, lineHeight: '30px' }}>{memberSince ?? '—'}</p>
            <p style={{ margin: '2px 0 0', fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>Member since</p>
          </div>
        </motion.div>

        {/* Feature request */}
        <motion.a
          href={buildFeatureRequestHref(email)}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.15 }}
          whileTap={{ scale: 0.98 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: T.greenLight, border: `1.5px solid ${T.greenMid}`,
            borderRadius: T.r, padding: '16px 18px', boxShadow: T.shadow,
            textDecoration: 'none', cursor: 'pointer',
          }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 20 }}>💡</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.greenDark }}>Request a feature</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: T.sub }}>Have an idea? Send it straight to the developer</p>
          </div>
          <span style={{ fontSize: 16, color: T.green }}>→</span>
        </motion.a>

        {/* App info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.2 }}
          style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r, boxShadow: T.shadow, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 13, color: T.sub, fontWeight: 500 }}>App</span>
            <span style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>Plant Care</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
            <span style={{ fontSize: 13, color: T.sub, fontWeight: 500 }}>Version</span>
            <span style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>1.0</span>
          </div>
        </motion.div>

        {/* Log out */}
        <motion.button
          onClick={signOut} disabled={signingOut}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.25 }}
          whileTap={{ scale: 0.98 }}
          style={{
            width: '100%', padding: 15, marginTop: 4,
            background: T.surface, color: T.danger,
            border: `1.5px solid ${T.dangerBorder}`, borderRadius: T.rSm,
            fontSize: 14, fontWeight: 600,
            cursor: signingOut ? 'default' : 'pointer', opacity: signingOut ? 0.6 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          {signingOut ? <><Spinner /> Signing out…</> : 'Log out'}
        </motion.button>
      </div>

      <Nav />
    </main>
  );
}
