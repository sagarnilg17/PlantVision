'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Nav } from '@/components/Nav';
import { T } from '@/lib/theme';

const SPRING_UI  = { type: 'spring' as const, bounce: 0, duration: 0.35 };
const SPRING_TAP = { type: 'spring' as const, bounce: 0, duration: 0.18 };

const DEVELOPER_EMAIL = 'sagarnil.g17x@gmail.com';

function buildEmailHref(subject: string, bodyLines: string[], userEmail: string | null) {
  const body = [
    ...bodyLines,
    '',
    '—',
    `Sent from Plant Care${userEmail ? ` by ${userEmail}` : ''}`,
  ].join('\n');
  return `mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function Spinner({ size = 20 }: { size?: number }) {
  return <div style={{ width: size, height: size, border: `2px solid ${T.greenLight}`, borderTop: `2px solid ${T.green}`, borderRadius: '50%', animation: 'spin 0.75s linear infinite', flexShrink: 0 }} />;
}

function ChevronRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: '0 0 8px 4px', fontSize: 13, fontWeight: 700, color: T.sub }}>
      {children}
    </p>
  );
}

function RowDivider() {
  return <div style={{ height: '0.5px', background: T.border, marginLeft: 16 }} />;
}

function RowItem({ label, sub, href, onClick, danger }: {
  label: string; sub?: string; href?: string;
  onClick?: () => void; danger?: boolean;
}) {
  const color = danger ? T.danger : T.text;
  const inner = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color }}>{label}</p>
        {sub && <p style={{ margin: '2px 0 0', fontSize: 12, color: T.muted }}>{sub}</p>}
      </div>
      <div style={{ color: danger ? T.dangerBorder : T.muted, flexShrink: 0 }}>
        <ChevronRight />
      </div>
    </div>
  );

  if (href) {
    return (
      <motion.a href={href} whileTap={{ scale: 0.99 }} whileHover={{ backgroundColor: 'rgba(0,0,0,0.028)' }} transition={SPRING_TAP}
        style={{ display: 'block', textDecoration: 'none' }}>
        {inner}
      </motion.a>
    );
  }
  return (
    <motion.div
      onClick={onClick}
      role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
      whileTap={{ scale: 0.99 }}
      whileHover={{ backgroundColor: 'rgba(0,0,0,0.028)' }}
      transition={SPRING_TAP}
      style={{ cursor: 'pointer' }}>
      {inner}
    </motion.div>
  );
}

function GroupCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_UI, delay }}
      style={{
        background: T.glassCard,
        border: T.glassCardBd,
        boxShadow: T.glassCardSh,
        borderRadius: T.r,
        overflow: 'hidden',
      }}>
      {children}
    </motion.div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [email,       setEmail]       = useState<string | null>(null);
  const [name,        setName]        = useState<string | null>(null);
  const [avatarUrl,   setAvatarUrl]   = useState<string | null>(null);
  const [plantCount,  setPlantCount]  = useState<number | null>(null);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [signingOut,  setSigningOut]  = useState(false);

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
      <main style={{ minHeight: '100dvh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size={28} />
      </main>
    );
  }

  const displayName = name ?? email?.split('@')[0] ?? 'My Profile';
  const initial     = displayName[0].toUpperCase();

  const featureHref = buildEmailHref('Plant Care — Feature Request', [
    'Hi Sagar,',
    '',
    'I have a feature idea for Plant Care!',
    '',
    'What I want to do:',
    '(describe the feature here)',
    '',
    'Why it would help me:',
    '(what problem does it solve?)',
  ], email);

  const reportHref = buildEmailHref('Plant Care — Problem Report', [
    'Hi Sagar,',
    '',
    'I ran into a problem with Plant Care:',
    '',
    'What happened:',
    '(describe the issue here)',
    '',
    'Steps to reproduce:',
    '1.',
    '2.',
  ], email);

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', background: 'transparent', paddingBottom: 110 }}>

      {/* ── Sticky glass header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: T.glassChromeBase,
        backdropFilter: T.glassChromeBlur,
        WebkitBackdropFilter: T.glassChromeBlur,
        borderBottom: T.glassChromeBd,
        boxShadow: T.glassChromeSh,
        padding: `calc(env(safe-area-inset-top, 20px) + 10px) 20px 14px`,
      }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: -0.4 }}>Profile</h1>
      </div>

      <div style={{ padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Identity card ── */}
        <GroupCard delay={0}>
          <div style={{ padding: '24px 20px', textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={SPRING_UI}
              style={{
                width: 80, height: 80, borderRadius: '50%',
                margin: '0 auto 14px',
                background: avatarUrl ? 'none' : `linear-gradient(135deg, ${T.green}, ${T.greenDark})`,
                boxShadow: '0 4px 20px rgba(46,125,50,0.28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>{initial}</span>}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING_UI, delay: 0.06 }}>
              <p style={{ margin: '0 0 3px', fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: -0.3 }}>
                {displayName}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: T.muted }}>{email}</p>
            </motion.div>
          </div>
        </GroupCard>

        {/* ── Stats ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_UI, delay: 0.08 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: T.glassCard, border: T.glassCardBd, boxShadow: T.glassCardSh, borderRadius: T.rSm, padding: '16px 12px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: T.green, lineHeight: 1 }}>
              {plantCount ?? '—'}
            </p>
            <p style={{ margin: '5px 0 0', fontSize: 11, color: T.muted, fontWeight: 500 }}>
              Plants
            </p>
          </div>
          <div style={{ background: T.glassCard, border: T.glassCardBd, boxShadow: T.glassCardSh, borderRadius: T.rSm, padding: '16px 12px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: memberSince && memberSince.length > 12 ? 13 : 17, fontWeight: 800, color: T.text, lineHeight: 1.25 }}>
              {memberSince ?? '—'}
            </p>
            <p style={{ margin: '5px 0 0', fontSize: 11, color: T.muted, fontWeight: 500 }}>
              Member since
            </p>
          </div>
        </motion.div>

        {/* ── Help & Support ── */}
        <div>
          <SectionLabel>Help &amp; Support</SectionLabel>
          <GroupCard delay={0.12}>
            <RowItem
              label="Request a feature"
              sub="Share an idea with the developer"
              href={featureHref}
            />
            <RowDivider />
            <RowItem
              label="Report a problem"
              sub="Something not working? Let us know"
              href={reportHref}
            />
          </GroupCard>
        </div>

        {/* ── About ── */}
        <div>
          <SectionLabel>About</SectionLabel>
          <GroupCard delay={0.16}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Plant Care</span>
              <span style={{ fontSize: 13, color: T.muted }}>Version 1.0</span>
            </div>
            <RowDivider />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Made with</span>
              <span style={{ fontSize: 13, color: T.muted }}>🌱 in India</span>
            </div>
          </GroupCard>
        </div>

        {/* ── Account ── */}
        <div>
          <SectionLabel>Account</SectionLabel>
          <GroupCard delay={0.20}>
            <RowItem label="Sign out" danger onClick={signOut} />
          </GroupCard>
        </div>

        {signingOut && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: T.muted, fontSize: 13 }}>
            <Spinner size={16} /> Signing out…
          </div>
        )}

      </div>

      <Nav />
    </main>
  );
}
