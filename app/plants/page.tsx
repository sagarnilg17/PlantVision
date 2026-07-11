'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { computeWatering, nextWateringDate, type LightLevel } from '@/lib/careEngine';
import { Nav } from '@/components/Nav';
import { T } from '@/lib/theme';

const SPRING_UI  = { type: 'spring' as const, bounce: 0, duration: 0.35 };
const SPRING_TAP = { type: 'spring' as const, bounce: 0, duration: 0.18 };

type Plant = {
  id: string; plant_name: string; nickname: string | null;
  scientific_name: string | null;
  image_urls: string[]; next_watering_due: string | null;
  last_watered: string | null;
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

function waterLabel(d: number) {
  if (d <= 0)  return { text: d === 0 ? 'Water today' : `Overdue ${Math.abs(d)}d`, color: T.amberText, bg: T.amberLight, border: T.amberBorder };
  if (d === 1) return { text: 'Tomorrow', color: T.green, bg: T.greenLight, border: T.greenMid };
  return               { text: `In ${d}d`, color: T.green, bg: T.greenLight, border: T.greenMid };
}

function PlantAvatar({ plant, size = 64 }: { plant: Plant; size?: number }) {
  const src   = plant.illustration_url || plant.image_urls?.[0] || null;
  const isIll = !!plant.illustration_url;
  const init  = (plant.nickname || plant.plant_name).charAt(0).toUpperCase();
  const r     = Math.round(size * 0.22);
  if (!src) {
    return (
      <div style={{ width: size, height: size, flexShrink: 0, background: avatarBg(plant.plant_name), borderRadius: r, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${T.border}` }}>
        <span style={{ fontSize: size * 0.40, fontWeight: 800, color: T.green, lineHeight: 1 }}>{init}</span>
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, flexShrink: 0, borderRadius: r, overflow: 'hidden', border: `1px solid ${T.border}`, background: isIll ? '#fff' : T.greenLight }}>
      <img src={src} alt={plant.plant_name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: isIll ? 'contain' : 'cover' }} />
    </div>
  );
}

function PlantCard({ p, idx, userId, onRefresh }: {
  p: Plant; idx: number; userId: string; onRefresh: () => void;
}) {
  const router = useRouter();
  const [watering, setWatering] = useState(false);
  const [watered,  setWatered]  = useState(false);

  const d       = p.next_watering_due ? dayDiff(p.next_watering_due) : null;
  const overdue = d !== null && d <= 0;
  const wl      = d !== null ? waterLabel(d) : null;
  const hm      = healthMeta(p.plant_health);
  const firstNote = p.plant_health_details ? p.plant_health_details.split(';')[0].trim() : null;

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
      onClick={() => router.push(`/plant/${p.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/plant/${p.id}`); } }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ ...SPRING_UI, delay: idx * 0.05 }}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.975 }}
      style={{
        background: T.glassCard,
        border: T.glassCardBd,
        boxShadow: T.glassCardSh,
        borderRadius: T.r,
        marginBottom: 12,
        cursor: 'pointer',
        display: 'flex', alignItems: 'stretch', overflow: 'hidden',
      }}>

      {/* Avatar */}
      <div style={{ padding: 14, paddingRight: 0, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <PlantAvatar plant={p} size={64} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '14px 10px 14px 14px', minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: watered ? T.green : T.text, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {watered && '✓ '}{p.nickname || p.plant_name}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: T.muted, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.nickname ? p.plant_name : (p.scientific_name ?? '')}
        </p>

        {/* Watering row */}
        <div style={{ display: 'flex', gap: 6, marginTop: 9, alignItems: 'center', flexWrap: 'wrap' }}>
          {wl && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: wl.bg, color: wl.color,
              border: `0.5px solid ${wl.border}`,
              borderRadius: T.rPill, padding: '4px 10px',
              fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
            }}>
              💧 {wl.text}
            </span>
          )}

          {p.light_level && (
            <span style={{ fontSize: 13, color: T.muted }}>
              {p.light_level === 'low' ? '🌥️' : p.light_level === 'medium' ? '⛅' : '☀️'}
            </span>
          )}
        </div>

        {/* Health */}
        {hm && hm.label !== 'Healthy' && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: `0.5px solid ${T.border}` }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: hm.bg, color: hm.color,
              border: `0.5px solid ${hm.border}`,
              borderRadius: T.rPill, padding: '3px 9px',
              fontSize: 11, fontWeight: 700,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: hm.color, flexShrink: 0 }} />
              {hm.label}
            </span>
            {firstNote && (
              <p style={{ margin: '5px 0 0', fontSize: 11, color: T.sub, lineHeight: 1.45 }}>{firstNote}</p>
            )}
          </div>
        )}
      </div>

      {/* Quick water / chevron */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingRight: 12, gap: 6 }}>
        {overdue && !watered && (
          <button
            onClick={quickWater}
            disabled={watering}
            aria-label={`Water ${p.nickname || p.plant_name}`}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'transparent', border: 'none', padding: 0,
              cursor: watering ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: T.green, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(46,125,50,0.40)', fontSize: 13,
            }}>
              {watering
                ? <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : '💧'}
            </div>
          </button>
        )}
        {!overdue && (
          <div style={{ color: T.muted }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: T.glassCard, border: T.glassCardBd, boxShadow: T.glassCardSh, borderRadius: T.r, marginBottom: 12, display: 'flex', padding: 14, gap: 12 }}>
      <div style={{ width: 64, height: 64, borderRadius: 14, background: T.border, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ width: '60%', height: 15, borderRadius: 5, background: T.border, marginBottom: 8 }} />
        <div style={{ width: '38%', height: 11, borderRadius: 4, background: T.border, marginBottom: 12 }} />
        <div style={{ width: 80, height: 24, borderRadius: T.rPill, background: T.border }} />
      </div>
    </div>
  );
}

export default function PlantsPage() {
  const router   = useRouter();
  const [plants,    setPlants]    = useState<Plant[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [userId,    setUserId]    = useState<string | null>(null);
  const [search,    setSearch]    = useState('');
  const [loadError, setLoadError] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const load = useCallback(async (uid: string) => {
    setLoadError(false);
    try {
      const { data, error } = await supabase
        .from('plants')
        .select('id, plant_name, nickname, scientific_name, image_urls, next_watering_due, last_watered, light_level, plant_health, plant_health_details, illustration_url, watering_frequency')
        .eq('user_id', uid)
        .order('next_watering_due', { ascending: true, nullsFirst: false });
      if (error) throw error;
      if (data) setPlants(data as Plant[]);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      setUserId(data.user.id);
      load(data.user.id);
    });
  }, [router, load]);

  const q = search.toLowerCase().trim();
  const filtered = q
    ? plants.filter(p =>
        (p.nickname ?? '').toLowerCase().includes(q)
        || p.plant_name.toLowerCase().includes(q)
        || (p.scientific_name ?? '').toLowerCase().includes(q),
      )
    : plants;

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', background: 'transparent', paddingBottom: 104 }}>

      {/* ── Sticky glass header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: T.glassChromeBase,
        backdropFilter: T.glassChromeBlur,
        WebkitBackdropFilter: T.glassChromeBlur,
        borderBottom: T.glassChromeBd,
        boxShadow: T.glassChromeSh,
        padding: `calc(env(safe-area-inset-top, 20px) + 10px) 16px 14px`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <h1 style={{ flex: 1, margin: 0, fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: -0.4 }}>
            My Garden
          </h1>
          {!loading && (
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={SPRING_UI}
              style={{
                background: T.glassCard, border: T.glassCardBd, boxShadow: T.glassCardSh,
                borderRadius: T.rPill, padding: '4px 12px',
                fontSize: 12, fontWeight: 700, color: T.green,
              }}>
              {plants.length} plant{plants.length === 1 ? '' : 's'}
            </motion.span>
          )}
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.muted, pointerEvents: 'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="search"
            placeholder="Search plants…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            aria-label="Search plants"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 36px 10px 34px',
              background: searchFocused ? 'rgba(255,255,255,0.90)' : T.glassCard,
              border: searchFocused ? `1px solid ${T.green}` : T.glassCardBd,
              boxShadow: searchFocused ? `0 0 0 3px ${T.greenLight}` : T.glassCardSh,
              borderRadius: T.rPill,
              fontSize: 14, color: T.text,
              outline: 'none',
              transition: 'box-shadow 0.2s, border-color 0.2s, background 0.2s',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Clear search"
              style={{
                position: 'absolute', right: 0, top: 0, width: 44, height: '100%',
                background: 'transparent', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: T.muted, fontSize: 16,
              }}>
              ×
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '16px 14px 0' }}>

        {/* Error */}
        {!loading && loadError && (
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

        {/* Skeletons */}
        {loading && [0, 1, 2].map(i => (
          <div key={i} style={{ opacity: 1 - i * 0.28 }}>
            <SkeletonCard />
          </div>
        ))}

        {/* Plant list */}
        {!loading && !loadError && (
          <AnimatePresence mode="popLayout">
            {filtered.map((p, idx) => (
              <PlantCard
                key={p.id} p={p} idx={idx}
                userId={userId as string}
                onRefresh={() => userId && load(userId)}
              />
            ))}
          </AnimatePresence>
        )}

        {/* No results from search */}
        {!loading && !loadError && search && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={SPRING_UI}
            style={{ textAlign: 'center', padding: '48px 20px' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 6px' }}>No plants found</p>
            <p style={{ fontSize: 13, color: T.sub, margin: 0 }}>Try a different name</p>
          </motion.div>
        )}

        {/* Empty state — no plants yet */}
        {!loading && !loadError && !search && plants.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING_UI, delay: 0.05 }}
            style={{ textAlign: 'center', padding: '56px 20px' }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: T.glassCard, border: T.glassCardBd, boxShadow: T.glassCardSh, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 36 }}>
              🪴
            </div>
            <p style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: '0 0 8px' }}>No plants yet</p>
            <p style={{ fontSize: 13, color: T.sub, margin: '0 0 24px', lineHeight: 1.6 }}>
              Use the scan button to identify and add your first plant.
            </p>
            <motion.button
              onClick={() => router.push('/scan?mode=camera')}
              whileTap={{ scale: 0.97 }}
              transition={SPRING_TAP}
              style={{
                background: T.green, color: '#fff', border: 'none',
                borderRadius: T.rSm, padding: '13px 28px',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(46,125,50,0.32)',
              }}>
              Scan a plant
            </motion.button>
          </motion.div>
        )}
      </div>

      <Nav />
    </main>
  );
}
