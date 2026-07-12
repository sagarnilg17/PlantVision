'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { computeWatering, nextWateringDate, type LightLevel } from '@/lib/careEngine';
import { Nav } from '@/components/Nav';
import { InstallBanner } from '@/components/InstallBanner';
import { PermaTipsCarousel } from '@/components/PermaTipsCarousel';
import { T } from '@/lib/theme';

const SPRING_UI  = { type: 'spring' as const, bounce: 0, duration: 0.35 };
const SPRING_TAP = { type: 'spring' as const, bounce: 0, duration: 0.18 };

type Plant = {
  id: string; plant_name: string; nickname: string | null;
  scientific_name: string | null;
  image_urls: string[]; next_watering_due: string | null;
  light_level: string | null; plant_health: string | null;
  plant_health_details: string | null;
  illustration_url: string | null;
  watering_frequency: string;
};

const dayDiff = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

const AVATAR_BG = ['#E8F5E9', '#E3F2FD', '#FFF3E0', '#FCE4EC', '#EDE7F6', '#E0F2F1'];
function avatarBg(name: string) {
  const n = (name.charCodeAt(0) ?? 65) + (name.charCodeAt(1) ?? 65);
  return AVATAR_BG[n % AVATAR_BG.length];
}

function healthMeta(h: string | null) {
  if (!h) return null;
  if (h === 'healthy')     return { color: T.green,  bg: T.greenLight,  border: T.greenMid,    label: 'Healthy' };
  if (h === 'mild stress') return { color: T.warn,   bg: T.warnLight,   border: T.amberBorder, label: 'Mild stress' };
  return                          { color: T.danger, bg: T.dangerLight, border: T.dangerBorder, label: 'Needs care' };
}

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function PlantAvatar({ plant, size = 48 }: { plant: Plant; size?: number }) {
  const src   = plant.illustration_url || plant.image_urls?.[0] || null;
  const isIll = !!plant.illustration_url;
  const init  = (plant.nickname || plant.plant_name).charAt(0).toUpperCase();
  const r     = Math.round(size * 0.28);
  if (!src) {
    return (
      <div style={{ width: size, height: size, flexShrink: 0, background: avatarBg(plant.plant_name), borderRadius: r, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${T.border}` }}>
        <span style={{ fontSize: size * 0.42, fontWeight: 800, color: T.green, lineHeight: 1 }}>{init}</span>
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, flexShrink: 0, borderRadius: r, overflow: 'hidden', border: `1px solid ${T.border}`, background: isIll ? '#fff' : T.greenLight }}>
      <img src={src} alt={plant.plant_name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: isIll ? 'contain' : 'cover' }} />
    </div>
  );
}

function AttentionCard({ p, idx, userId, onRefresh }: {
  p: Plant; idx: number; userId: string; onRefresh: () => void;
}) {
  const router = useRouter();
  const [watering, setWatering] = useState(false);
  const [watered,  setWatered]  = useState(false);

  const d       = p.next_watering_due ? dayDiff(p.next_watering_due) : null;
  const overdue = d !== null && d <= 0;
  const hm      = healthMeta(p.plant_health);

  const urgencyLabel  = overdue
    ? (d === 0 ? 'Water today' : `Overdue ${Math.abs(d!)}d`)
    : hm?.label ?? 'Needs attention';
  const urgencyColor  = overdue ? T.amberText   : (hm?.color  ?? T.sub);
  const urgencyBg     = overdue ? T.amberLight  : (hm?.bg     ?? T.greenLight);
  const urgencyBorder = overdue ? T.amberBorder : (hm?.border ?? T.greenMid);

  const quickWater = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (watering || watered) return;
    setWatering(true);
    try {
      const engine = computeWatering({ baseWateringFrequency: p.watering_frequency, light: (p.light_level as LightLevel) ?? null, lat: null });
      const today  = new Date().toISOString().slice(0, 10);
      const due    = nextWateringDate(today, engine.intervalDays);
      await supabase.from('care_log').insert({ plant_id: p.id, user_id: userId, action: 'watered' });
      await supabase.from('plants').update({ last_watered: today, next_watering_due: due }).eq('id', p.id);
      setWatered(true);
      setTimeout(() => { setWatered(false); onRefresh(); }, 1400);
    } catch { /* best effort */ }
    finally { setWatering(false); }
  };

  return (
    <motion.div
      onClick={() => router.push(`/plant?id=${p.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/plant?id=${p.id}`); } }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ ...SPRING_UI, delay: idx * 0.05 }}
      whileTap={{ scale: 0.975 }}
      style={{
        background: T.glassCard,
        border: T.glassCardBd,
        boxShadow: T.glassCardSh,
        borderRadius: T.rSm,
        padding: '12px 14px',
        marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 12,
        cursor: 'pointer',
      }}>

      <PlantAvatar plant={p} size={48} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.nickname || p.plant_name}
        </p>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: urgencyBg, color: urgencyColor,
          border: `0.5px solid ${urgencyBorder}`,
          borderRadius: T.rPill, padding: '3px 9px',
          fontSize: 11, fontWeight: 600, marginTop: 5,
        }}>
          {overdue ? '💧' : '⚠️'} {urgencyLabel}
        </span>
      </div>

      {overdue && !watered && (
        <button
          onClick={quickWater}
          disabled={watering}
          aria-label={`Water ${p.nickname || p.plant_name}`}
          style={{
            width: 44, height: 44, flexShrink: 0,
            borderRadius: '50%', background: 'transparent',
            border: 'none', padding: 0,
            cursor: watering ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: T.green, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(46,125,50,0.40)', fontSize: 14,
          }}>
            {watering
              ? <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              : '💧'}
          </div>
        </button>
      )}

      {watered && (
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: T.greenLight, border: `1px solid ${T.greenMid}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
          ✓
        </div>
      )}

      {!overdue && (
        <div style={{ color: T.muted, flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      )}
    </motion.div>
  );
}

function Spinner({ size = 20 }: { size?: number }) {
  return <div style={{ width: size, height: size, border: `2px solid ${T.greenLight}`, borderTop: `2px solid ${T.green}`, borderRadius: '50%', animation: 'spin 0.75s linear infinite', flexShrink: 0 }} />;
}

export default function Dashboard() {
  const router = useRouter();
  const [plants,    setPlants]    = useState<Plant[]>([]);
  const [checking,  setChecking]  = useState(true);
  const [name,      setName]      = useState('');
  const [userId,    setUserId]    = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async (uid: string) => {
    setLoadError(false);
    try {
      const { data, error } = await supabase
        .from('plants')
        .select('id, plant_name, nickname, scientific_name, image_urls, next_watering_due, light_level, plant_health, plant_health_details, illustration_url, watering_frequency')
        .eq('user_id', uid)
        .order('next_watering_due', { ascending: true });
      if (error) throw error;
      if (data) setPlants(data as Plant[]);
    } catch {
      setLoadError(true);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      if (!data.user.user_metadata?.onboarding_done) { router.push('/onboarding'); return; }
      setUserId(data.user.id);
      setName(
        (data.user.user_metadata?.full_name as string)
        ?? (data.user.user_metadata?.name as string)
        ?? data.user.email?.split('@')[0]
        ?? '',
      );
      load(data.user.id);
    });
  }, [router, load]);

  const attention = plants.filter(p => {
    const d = p.next_watering_due ? dayDiff(p.next_watering_due) : null;
    return (d !== null && d <= 0) || (p.plant_health && p.plant_health !== 'healthy');
  });

  const userInitial = name ? name[0].toUpperCase() : '?';

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', background: 'transparent', paddingBottom: 104 }}>

      <InstallBanner />

      {/* ── Sticky glass header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: T.glassChromeBase,
        backdropFilter: T.glassChromeBlur,
        WebkitBackdropFilter: T.glassChromeBlur,
        borderBottom: T.glassChromeBd,
        boxShadow: T.glassChromeSh,
        padding: `calc(env(safe-area-inset-top, 20px) + 10px) 20px 14px`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: T.muted }}>
            {timeGreeting()}
          </p>
          <h1 style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: -0.4, lineHeight: 1.15 }}>
            {name || 'Your garden'}
          </h1>
        </div>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${T.green}, ${T.greenDark})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(46,125,50,0.32)',
        }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{userInitial}</span>
        </div>
      </div>

      <div style={{ padding: '20px 16px 0' }}>

        {/* ── Error ── */}
        {!checking && loadError && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={SPRING_UI}
            style={{ background: T.dangerLight, border: `1px solid ${T.dangerBorder}`, borderRadius: T.r, padding: '20px', marginBottom: 20, textAlign: 'center' }}>
            <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: T.danger }}>Couldn't load your plants</p>
            <button
              onClick={() => userId && load(userId)}
              style={{ background: T.danger, color: '#fff', border: 'none', borderRadius: T.rSm, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Try again
            </button>
          </motion.div>
        )}

        {/* ── Skeleton loading ── */}
        {checking && [0, 1].map(i => (
          <div key={i} style={{ background: T.glassCard, border: T.glassCardBd, boxShadow: T.glassCardSh, borderRadius: T.rSm, padding: '12px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, opacity: 1 - i * 0.35 }}>
            <div style={{ width: 48, height: 48, borderRadius: 13, background: T.border, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ width: '52%', height: 14, borderRadius: 5, background: T.border, marginBottom: 8 }} />
              <div style={{ width: '32%', height: 20, borderRadius: 10, background: T.border }} />
            </div>
          </div>
        ))}

        {/* ── Content ── */}
        {!checking && !loadError && (
          <>
            {/* Section header */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING_UI}
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: attention.length > 0 ? T.warn : T.green,
                boxShadow: attention.length > 0
                  ? `0 0 0 3px ${T.warnLight}`
                  : `0 0 0 3px ${T.greenLight}`,
              }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: T.sub }}>
                {attention.length > 0
                  ? `${attention.length} plant${attention.length === 1 ? '' : 's'} need${attention.length === 1 ? 's' : ''} care`
                  : 'All good today'}
              </span>
            </motion.div>

            {/* Attention cards */}
            <AnimatePresence mode="popLayout">
              {attention.map((p, idx) => (
                <AttentionCard
                  key={p.id} p={p} idx={idx}
                  userId={userId as string}
                  onRefresh={() => userId && load(userId)}
                />
              ))}
            </AnimatePresence>

            {/* All-good card */}
            {attention.length === 0 && plants.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING_UI, delay: 0.05 }}
                style={{
                  background: T.glassCard, border: T.glassCardBd, boxShadow: T.glassCardSh,
                  borderRadius: T.r, padding: '24px 20px', textAlign: 'center', marginBottom: 4,
                }}>
                <div style={{ fontSize: 38, marginBottom: 10 }}>🌿</div>
                <p style={{ margin: '0 0 5px', fontSize: 16, fontWeight: 700, color: T.text }}>Your garden is thriving</p>
                <p style={{ margin: 0, fontSize: 13, color: T.sub, lineHeight: 1.6 }}>
                  No plants need care right now.
                </p>
              </motion.div>
            )}

            {/* Empty — no plants yet */}
            {plants.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING_UI, delay: 0.05 }}
                style={{
                  background: T.glassCard, border: T.glassCardBd, boxShadow: T.glassCardSh,
                  borderRadius: T.r, padding: '32px 20px', textAlign: 'center', marginBottom: 4,
                }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🪴</div>
                <p style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: T.text }}>Start your garden</p>
                <p style={{ margin: 0, fontSize: 13, color: T.sub, lineHeight: 1.6 }}>
                  Scan a plant to track its care and keep it healthy.
                </p>
              </motion.div>
            )}

            {/* ── Quick actions ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_UI, delay: 0.1 }}
              style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <motion.button
                onClick={() => router.push('/scan?mode=camera')}
                whileTap={{ scale: 0.97 }}
                transition={SPRING_TAP}
                style={{
                  flex: 1, padding: '14px 16px',
                  background: T.green, color: '#fff',
                  border: 'none', borderRadius: T.rPill,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(46,125,50,0.32)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                Scan a plant
              </motion.button>
              <motion.button
                onClick={() => router.push('/plants')}
                whileTap={{ scale: 0.97 }}
                transition={SPRING_TAP}
                style={{
                  flex: 1, padding: '14px 16px',
                  background: T.glassCard, color: T.greenDark,
                  border: T.glassCardBd, boxShadow: T.glassCardSh,
                  borderRadius: T.rPill,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                My garden →
              </motion.button>
            </motion.div>

            {/* ── Tips (mixed across all the user's plants) ── */}
            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_UI, delay: 0.18 }}
              style={{ marginTop: 30 }}>
              <PermaTipsCarousel plants={plants} />
            </motion.div>
          </>
        )}
      </div>

      <Nav />
    </main>
  );
}
