'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { LocationPicker, type PickedLocation } from '@/components/LocationPicker';
import { T } from '@/lib/theme';

const SPRING_UI  = { type: 'spring' as const, bounce: 0,    duration: 0.35 };
const SPRING_TAP = { type: 'spring' as const, bounce: 0,    duration: 0.18 };
const SPRING_NAV = { type: 'spring' as const, bounce: 0.08, duration: 0.48 };

const EXPERTISE = [
  { key: 'beginner',     emoji: '🌱', label: 'Beginner',     sub: "I'm just getting started" },
  { key: 'intermediate', emoji: '🌿', label: 'Intermediate', sub: 'I know the basics, learning more' },
  { key: 'expert',       emoji: '🌳', label: 'Expert',       sub: 'Plants are my thing' },
];

function Spinner() {
  return (
    <div style={{ width: 18, height: 18, border: `2px solid rgba(255,255,255,0.4)`, borderTop: `2px solid #fff`, borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step,      setStep]      = useState(0);
  const [direction, setDirection] = useState(1);
  const [name,      setName]      = useState('');
  const [loc,       setLoc]       = useState<PickedLocation | null>(null);
  const [expertise, setExpertise] = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      const n = (data.user.user_metadata?.full_name as string)
             ?? (data.user.user_metadata?.name as string)
             ?? '';
      if (n) setName(n);
    });
  }, [router]);

  const next = () => { setDirection(1);  setStep(s => s + 1); };
  const back = () => { setDirection(-1); setStep(s => s - 1); };

  const finish = async () => {
    if (!expertise || saving) return;
    setSaving(true);
    await supabase.auth.updateUser({
      data: {
        full_name:       name.trim() || undefined,
        location:        loc?.place || undefined,
        lat:             loc?.lat ?? undefined,
        lng:             loc?.lng ?? undefined,
        expertise,
        onboarding_done: true,
      },
    });
    router.push('/');
  };

  const variants = {
    enter:  (dir: number) => ({ x: dir > 0 ? '55%'  : '-55%',  opacity: 0 }),
    center: ()            => ({ x: 0, opacity: 1 }),
    exit:   (dir: number) => ({ x: dir > 0 ? '-55%' : '55%', opacity: 0 }),
  };

  const TOTAL_STEPS = 3;

  const steps = [
    /* ── Step 0: Name ── */
    <div key="name" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ ...SPRING_NAV, delay: 0.1 }}
          style={{ fontSize: 64, marginBottom: 20, lineHeight: 1 }}>
          🌿
        </motion.div>
        <h1 style={{ margin: '0 0 10px', fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: -0.5, lineHeight: 1.2 }}>
          Welcome to Plant Care
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: T.muted, lineHeight: 1.55 }}>
          What should we call you?
        </p>
      </div>

      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && name.trim()) next(); }}
        autoFocus
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '15px 18px',
          background: T.glassCard, border: T.glassCardBd,
          boxShadow: T.glassCardSh,
          borderRadius: T.rSm, fontSize: 16, color: T.text,
          outline: 'none', marginBottom: 14,
        }}
      />

      <motion.button
        onClick={next}
        disabled={!name.trim()}
        whileTap={{ scale: 0.97 }} transition={SPRING_TAP}
        style={{
          width: '100%', padding: '15px 0',
          background: name.trim() ? T.green : T.greenLight,
          color: name.trim() ? '#fff' : T.muted,
          border: 'none', borderRadius: T.rPill,
          fontSize: 15, fontWeight: 700, cursor: name.trim() ? 'pointer' : 'default',
          boxShadow: name.trim() ? '0 4px 16px rgba(46,125,50,0.30)' : 'none',
          transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
        }}>
        Continue →
      </motion.button>

      <button
        onClick={next}
        style={{ background: 'none', border: 'none', color: T.muted, fontSize: 13, cursor: 'pointer', marginTop: 12, padding: 8 }}>
        Skip for now
      </button>
    </div>,

    /* ── Step 1: Location ── */
    <div key="location" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ ...SPRING_NAV, delay: 0.1 }}
          style={{ fontSize: 64, marginBottom: 20, lineHeight: 1 }}>
          🗺️
        </motion.div>
        <h1 style={{ margin: '0 0 10px', fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: -0.5, lineHeight: 1.2 }}>
          Where are your plants?
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: T.muted, lineHeight: 1.55 }}>
          Your region helps us tailor care advice for your climate.
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <LocationPicker value={loc} onChange={setLoc} />
      </div>

      <motion.button
        onClick={next}
        whileTap={{ scale: 0.97 }} transition={SPRING_TAP}
        style={{
          width: '100%', padding: '15px 0',
          background: T.green, color: '#fff',
          border: 'none', borderRadius: T.rPill,
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(46,125,50,0.30)',
          marginBottom: 10,
        }}>
        {loc ? 'Continue →' : 'Skip location →'}
      </motion.button>

      <div style={{ display: 'flex', gap: 10 }}>
        <motion.button
          onClick={back}
          whileTap={{ scale: 0.97 }} transition={SPRING_TAP}
          style={{
            flex: 1, padding: '13px 0',
            background: T.glassCard, color: T.sub,
            border: T.glassCardBd, boxShadow: T.glassCardSh,
            borderRadius: T.rPill, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
          ← Back
        </motion.button>
        <button
          onClick={next}
          style={{ flex: 1, background: 'none', border: 'none', color: T.muted, fontSize: 13, cursor: 'pointer', padding: 8 }}>
          Skip
        </button>
      </div>
    </div>,

    /* ── Step 2: Expertise ── */
    <div key="expertise" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ ...SPRING_NAV, delay: 0.1 }}
          style={{ fontSize: 64, marginBottom: 20, lineHeight: 1 }}>
          🌱
        </motion.div>
        <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: -0.5, lineHeight: 1.2 }}>
          How green is your thumb?
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: T.muted }}>
          We'll adjust tips to your level.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {EXPERTISE.map((e, i) => (
          <motion.button
            key={e.key}
            onClick={() => setExpertise(e.key)}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_UI, delay: i * 0.06 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 18px', textAlign: 'left',
              background: expertise === e.key ? 'rgba(46,125,50,0.08)' : T.glassCard,
              border: expertise === e.key ? `1.5px solid rgba(46,125,50,0.35)` : T.glassCardBd,
              boxShadow: expertise === e.key
                ? 'inset 0 1px 0 rgba(255,255,255,0.90), 0 4px 16px rgba(46,125,50,0.14)'
                : T.glassCardSh,
              borderRadius: T.rSm, cursor: 'pointer',
              transition: 'background 0.18s, border-color 0.18s, box-shadow 0.18s',
            }}>
            <span style={{ fontSize: 28, flexShrink: 0 }}>{e.emoji}</span>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: expertise === e.key ? T.green : T.text }}>{e.label}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: T.muted }}>{e.sub}</p>
            </div>
            {expertise === e.key && (
              <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: T.green, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
          </motion.button>
        ))}
      </div>

      <motion.button
        onClick={finish}
        disabled={!expertise || saving}
        whileTap={{ scale: 0.97 }} transition={SPRING_TAP}
        style={{
          width: '100%', padding: '15px 0',
          background: expertise ? T.green : T.greenLight,
          color: expertise ? '#fff' : T.muted,
          border: 'none', borderRadius: T.rPill,
          fontSize: 15, fontWeight: 700,
          cursor: expertise && !saving ? 'pointer' : 'default',
          boxShadow: expertise ? '0 4px 16px rgba(46,125,50,0.30)' : 'none',
          transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          marginBottom: 10,
        }}>
        {saving ? <><Spinner /> Setting up your garden…</> : "Let's start growing 🌿"}
      </motion.button>

      <motion.button
        onClick={back}
        whileTap={{ scale: 0.97 }} transition={SPRING_TAP}
        style={{
          width: '100%', padding: '13px 0',
          background: T.glassCard, color: T.sub,
          border: T.glassCardBd, boxShadow: T.glassCardSh,
          borderRadius: T.rPill, fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
        ← Back
      </motion.button>
    </div>,
  ];

  return (
    <main style={{
      maxWidth: 480, margin: '0 auto', minHeight: '100dvh',
      background: 'transparent',
      display: 'flex', flexDirection: 'column',
      padding: `calc(env(safe-area-inset-top, 20px) + 40px) 24px calc(env(safe-area-inset-bottom, 20px) + 32px)`,
    }}>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 40 }}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              width: i === step ? 20 : 6,
              background: i === step ? T.green : T.greenLight,
            }}
            transition={SPRING_UI}
            style={{ height: 6, borderRadius: 3 }}
          />
        ))}
      </div>

      {/* Step content with spring slide */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={SPRING_NAV}
            style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
