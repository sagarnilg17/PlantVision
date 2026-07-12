'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { computeWatering, nextWateringDate, type LightLevel } from '@/lib/careEngine';
import { Nav } from '@/components/Nav';
import { PermaTipsCarousel } from '@/components/PermaTipsCarousel';
import { getPlantTips } from '@/lib/permacultureTips';
import { T } from '@/lib/theme';

const SPRING_UI   = { type: 'spring' as const, bounce: 0,    duration: 0.35 };
const SPRING_TAP  = { type: 'spring' as const, bounce: 0,    duration: 0.18 };
const SPRING_SHEET = { type: 'spring' as const, bounce: 0.08, duration: 0.48 };

type Plant = {
  id: string; plant_name: string; nickname: string | null; scientific_name: string;
  image_urls: string[]; illustration_url: string | null;
  next_watering_due: string | null; last_watered: string | null;
  light_level: string | null; watering_frequency: string; watering_tips: string;
  pot_size: string; pot_size_reason: string; care_tips: string[]; confidence: string;
  toxicity_info: string | null;
};
type CareLog = { id: string; action: string; created_at: string };
type Checkin = { id: string; image_urls: string[]; created_at: string; notes: string | null };

const dayDiff = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

const LIGHTS: { key: LightLevel; label: string; icon: string; sub: string }[] = [
  { key: 'low',    label: 'Low',    icon: '🌥️', sub: 'Shade / north' },
  { key: 'medium', label: 'Medium', icon: '⛅',  sub: 'Indirect light' },
  { key: 'bright', label: 'Bright', icon: '☀️',  sub: 'Direct sun' },
];

function Spinner({ size = 20, light = false }: { size?: number; light?: boolean }) {
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      border: `2px solid ${light ? 'rgba(255,255,255,0.3)' : T.greenLight}`,
      borderTop: `2px solid ${light ? '#fff' : T.green}`,
      borderRadius: '50%', animation: 'spin 0.75s linear infinite',
    }} />
  );
}

const LOG_META: Record<string, { icon: string; label: string }> = {
  watered:    { icon: '💧', label: 'Watered' },
  fertilised: { icon: '🌱', label: 'Fertilised' },
  repotted:   { icon: '🪴', label: 'Repotted' },
};

function GlassCard({ children, delay = 0, style }: {
  children: React.ReactNode; delay?: number; style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_UI, delay }}
      style={{
        background: T.glassCard,
        border: T.glassCardBd,
        boxShadow: T.glassCardSh,
        borderRadius: T.r,
        ...style,
      }}>
      {children}
    </motion.div>
  );
}

export default function PlantDetail() {
  const router  = useRouter();

  // Route is /plant?id=… (query param, not a dynamic segment) so the page
  // static-exports as a single client shell that reads the id after mount.
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    setId(new URLSearchParams(window.location.search).get('id'));
  }, []);

  const [plant,    setPlant]    = useState<Plant | null>(null);
  const [logs,     setLogs]     = useState<CareLog[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [busy,     setBusy]     = useState(false);

  const [editOpen,     setEditOpen]     = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editLight,    setEditLight]    = useState<LightLevel | null>(null);
  const [saving,       setSaving]       = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const { data: p } = await supabase.from('plants').select('*').eq('id', id).single();
    if (p) setPlant(p as Plant);
    const { data: l } = await supabase.from('care_log').select('id, action, created_at').eq('plant_id', id).order('created_at', { ascending: false }).limit(10);
    if (l) setLogs(l as CareLog[]);
    const { data: ci } = await supabase.from('checkins').select('id, image_urls, created_at, notes').eq('plant_id', id).order('created_at', { ascending: false });
    if (ci) setCheckins(ci as Checkin[]);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login'); else load();
    });
  }, [id, router, load]);

  const openEdit = () => {
    if (!plant) return;
    setEditNickname(plant.nickname ?? '');
    setEditLight((plant.light_level as LightLevel) ?? null);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!plant || !id || saving) return;
    setSaving(true);
    const updates: Record<string, unknown> = {
      nickname: editNickname.trim() || null,
      light_level: editLight,
    };
    if (editLight && editLight !== plant.light_level) {
      const engine = computeWatering({ baseWateringFrequency: plant.watering_frequency, light: editLight, lat: null });
      const base = plant.last_watered ?? new Date().toISOString().slice(0, 10);
      updates.next_watering_due = nextWateringDate(base, engine.intervalDays);
    }
    await supabase.from('plants').update(updates).eq('id', id);
    await load();
    setSaving(false);
    setEditOpen(false);
  };

  const deletePlant = async () => {
    if (!id) return;
    setDeleting(true);
    await supabase.from('care_log').delete().eq('plant_id', id);
    await supabase.from('checkins').delete().eq('plant_id', id);
    await supabase.from('plants').delete().eq('id', id);
    router.push('/');
  };

  const logAction = async (action: string) => {
    if (!plant || !id) return;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from('care_log').insert({ plant_id: id, user_id: u.user.id, action });
    if (action === 'watered') {
      const engine = computeWatering({ baseWateringFrequency: plant.watering_frequency, light: (plant.light_level as LightLevel) ?? null, lat: null });
      const today = new Date().toISOString().slice(0, 10);
      await supabase.from('plants').update({ last_watered: today, next_watering_due: nextWateringDate(today, engine.intervalDays) }).eq('id', id);
    }
    await load();
    setBusy(false);
  };

  if (!plant) {
    return (
      <main style={{ minHeight: '100dvh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
        <Spinner size={28} />
        <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>Loading plant…</p>
      </main>
    );
  }

  const d       = plant.next_watering_due ? dayDiff(plant.next_watering_due) : null;
  const overdue = d !== null && d <= 0;

  const toxicity = (() => {
    if (!plant.toxicity_info) return null;
    try { return JSON.parse(plant.toxicity_info) as { animals?: boolean; humans?: boolean; notes?: string }; }
    catch { return null; }
  })();
  const isToxic = toxicity ? (toxicity.animals || toxicity.humans) : false;

  const QUICK = [
    { action: 'watered',    icon: '💧', label: 'Watered' },
    { action: 'fertilised', icon: '🌱', label: 'Fertilised' },
    { action: 'repotted',   icon: '🪴', label: 'Repotted' },
  ];

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', background: 'transparent', paddingBottom: 100 }}>

      {/* ── Glass sticky header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={SPRING_UI}
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: T.glassChromeBase,
          backdropFilter: T.glassChromeBlur,
          WebkitBackdropFilter: T.glassChromeBlur,
          borderBottom: T.glassChromeBd,
          boxShadow: T.glassChromeSh,
          padding: `calc(env(safe-area-inset-top, 20px) + 8px) 16px 12px`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
        <motion.button
          onClick={() => router.back()}
          aria-label="Go back"
          whileTap={{ scale: 0.92 }} transition={SPRING_TAP}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.60)',
            border: T.glassCardBd,
            boxShadow: T.glassCardSh,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, fontSize: 16, color: T.text,
          }}>
          <span aria-hidden="true">←</span>
        </motion.button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: -0.3 }}>
            {plant.nickname || plant.plant_name}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: T.muted, fontStyle: 'italic' }}>{plant.scientific_name}</p>
        </div>
        <motion.button
          onClick={openEdit}
          aria-label="Edit plant"
          whileTap={{ scale: 0.92 }} transition={SPRING_TAP}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.60)',
            border: T.glassCardBd, boxShadow: T.glassCardSh,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </motion.button>
      </motion.div>

      {/* ── Hero image ── */}
      {(plant.illustration_url || plant.image_urls?.[0]) && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ ...SPRING_UI, delay: 0.05 }}
          style={{
            height: 220, overflow: 'hidden', position: 'relative',
            background: plant.illustration_url ? 'rgba(255,255,255,0.60)' : T.greenLight,
          }}>
          <img
            src={plant.illustration_url || plant.image_urls[0]}
            alt={plant.plant_name}
            style={{
              width: '100%', height: '100%',
              objectFit: plant.illustration_url ? 'contain' : 'cover',
              mixBlendMode: plant.illustration_url ? 'multiply' : undefined,
            }}
          />
          {/* Confidence + toxicity badges over hero */}
          <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 6 }}>
            {plant.confidence && (
              <span style={{
                fontSize: 11, fontWeight: 700, color: T.greenDark,
                background: 'rgba(255,255,255,0.82)',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                border: '0.5px solid rgba(255,255,255,0.60)',
                borderRadius: T.rPill, padding: '4px 10px',
              }}>
                {plant.confidence} match
              </span>
            )}
            {isToxic && (
              <span style={{
                fontSize: 11, fontWeight: 700, color: T.danger,
                background: 'rgba(255,255,255,0.82)',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                border: '0.5px solid rgba(255,255,255,0.60)',
                borderRadius: T.rPill, padding: '4px 10px',
              }}>
                ⚠️ Toxic
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Photo strip */}
      {plant.image_urls?.length > 0 && (
        <div style={{ display: 'flex', gap: 8, padding: '14px 16px 0', overflowX: 'auto' }}>
          {plant.image_urls.map((url, i) => (
            <div key={i} style={{ flexShrink: 0, width: 80, height: 80, borderRadius: 12, overflow: 'hidden', border: T.glassCardBd, boxShadow: T.glassCardSh }}>
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Watering status ── */}
        <GlassCard delay={0.06} style={{
          background: overdue ? T.amberLight : T.greenLight,
          border: `1px solid ${overdue ? T.amberBorder : T.greenMid}`,
          padding: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: overdue ? T.amberText : T.greenDark }}>
              {d === null ? 'No watering schedule yet' : d <= 0 ? '💧 Needs water today' : `💧 Next water in ${d} day${d !== 1 ? 's' : ''}`}
            </p>
            {plant.watering_frequency && (
              <span style={{
                fontSize: 11, color: T.sub,
                background: 'rgba(255,255,255,0.7)', border: `1px solid ${overdue ? T.amberBorder : T.greenMid}`,
                borderRadius: T.rPill, padding: '2px 8px', whiteSpace: 'nowrap', marginLeft: 8, flexShrink: 0,
              }}>
                {plant.watering_frequency}
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: T.sub, lineHeight: 1.5 }}>{plant.watering_tips}</p>
        </GlassCard>

        {/* ── Light + pot info ── */}
        <GlassCard delay={0.08}>
          <div style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
            {plant.light_level && (
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 2px', fontSize: 12, color: T.muted, fontWeight: 500 }}>Light</p>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>
                  {plant.light_level === 'low' ? '🌥️ Low' : plant.light_level === 'medium' ? '⛅ Medium' : '☀️ Bright'}
                </p>
              </div>
            )}
            {plant.pot_size && (
              <div style={{ flex: 1, borderLeft: plant.light_level ? `0.5px solid ${T.border}` : undefined, paddingLeft: plant.light_level ? 12 : 0 }}>
                <p style={{ margin: '0 0 2px', fontSize: 12, color: T.muted, fontWeight: 500 }}>Pot size</p>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>🪴 {plant.pot_size}</p>
              </div>
            )}
          </div>
          {plant.pot_size_reason && (
            <p style={{ margin: 0, padding: '0 16px 14px', fontSize: 12, color: T.sub, lineHeight: 1.5 }}>{plant.pot_size_reason}</p>
          )}
        </GlassCard>

        {/* ── Toxicity ── */}
        {toxicity && (
          <GlassCard delay={0.10} style={{
            background: isToxic ? T.dangerLight : T.greenLight,
            border: `1px solid ${isToxic ? T.dangerBorder : T.greenMid}`,
            padding: 14,
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{isToxic ? '⚠️' : '✅'}</span>
              <div>
                <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: isToxic ? T.danger : T.green }}>
                  {isToxic ? 'Toxic' : 'Non-toxic'}
                  {toxicity.animals && toxicity.humans ? ' to pets & humans' : toxicity.animals ? ' to pets' : toxicity.humans ? ' to humans' : ''}
                </p>
                {toxicity.notes && <p style={{ margin: 0, fontSize: 13, color: T.sub, lineHeight: 1.5 }}>{toxicity.notes}</p>}
              </div>
            </div>
          </GlassCard>
        )}

        {/* ── Quick log ── */}
        <GlassCard delay={0.12}>
          <div style={{ padding: '14px 16px 16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Log care</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {QUICK.map(q => (
                <motion.button
                  key={q.action}
                  onClick={() => logAction(q.action)}
                  disabled={busy}
                  whileTap={{ scale: 0.94 }} transition={SPRING_TAP}
                  style={{
                    flex: 1, padding: '12px 4px 14px',
                    borderRadius: T.rSm, textAlign: 'center',
                    background: T.glassCard,
                    border: T.glassCardBd,
                    boxShadow: T.glassCardSh,
                    cursor: busy ? 'default' : 'pointer',
                    opacity: busy ? 0.6 : 1,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  }}>
                  <span style={{ fontSize: 22 }}>{q.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{q.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* ── Re-scan ── */}
        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_UI, delay: 0.14 }}
          onClick={() => router.push(`/scan?recheck=${id}`)}
          whileTap={{ scale: 0.97 }}
          style={{
            width: '100%', padding: 14,
            background: T.glassCard, color: T.green,
            border: `1.5px solid rgba(46,125,50,0.30)`,
            boxShadow: T.glassCardSh,
            borderRadius: T.rSm, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
          Re-scan &amp; update health
        </motion.button>

        {/* ── Activity log ── */}
        {logs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_UI, delay: 0.18 }}>
            <p style={{ margin: '0 0 10px 2px', fontSize: 14, fontWeight: 700, color: T.text }}>Recent activity</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {logs.map(l => {
                const meta = LOG_META[l.action] ?? { icon: '•', label: l.action };
                return (
                  <div key={l.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px',
                    background: T.glassCard, border: T.glassCardBd, boxShadow: T.glassCardSh,
                    borderRadius: T.rSm,
                  }}>
                    <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{meta.icon} {meta.label}</span>
                    <span style={{ fontSize: 12, color: T.muted }}>
                      {new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Growth timeline ── */}
        {checkins.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_UI, delay: 0.20 }}>
            <p style={{ margin: '0 0 10px 2px', fontSize: 14, fontWeight: 700, color: T.text }}>Growth timeline</p>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {checkins.map(ci => (
                <div key={ci.id} style={{ flexShrink: 0, width: 88 }}>
                  <div style={{ width: 88, height: 88, borderRadius: T.rSm, overflow: 'hidden', border: T.glassCardBd, boxShadow: T.glassCardSh }}>
                    <img src={ci.image_urls?.[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <p style={{ margin: '5px 0 0', fontSize: 10, color: T.muted, textAlign: 'center' }}>
                    {new Date(ci.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Gardening wisdom, specific to this plant ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_UI, delay: 0.22 }}>
          <PermaTipsCarousel
            tips={getPlantTips(plant, 6)}
            heading={`Tips for ${plant.nickname || plant.plant_name}`}
            subject={plant.nickname || plant.plant_name}
          />
        </motion.div>

        {/* ── Remove plant ── */}
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ ...SPRING_UI, delay: 0.24 }}
          onClick={() => setDeleteConfirm(true)}
          whileTap={{ scale: 0.98 }}
          style={{
            width: '100%', padding: 13,
            background: T.glassCard, color: T.danger,
            border: `0.5px solid ${T.dangerBorder}`,
            boxShadow: T.glassCardSh,
            borderRadius: T.rSm, fontSize: 14, fontWeight: 500, cursor: 'pointer', marginTop: 4,
          }}>
          Remove plant
        </motion.button>

      </div>

      {/* ── Edit sheet — spring from bottom ── */}
      <AnimatePresence>
        {editOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setEditOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.40)' }}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={SPRING_SHEET}
              onClick={e => e.stopPropagation()}
              style={{
                position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                width: '100%', maxWidth: 480, zIndex: 201,
                background: T.glassChromeBase,
                backdropFilter: T.glassChromeBlur,
                WebkitBackdropFilter: T.glassChromeBlur,
                borderRadius: '24px 24px 0 0',
                border: T.glassChromeBd,
                boxShadow: T.glassPanelSh,
                padding: `24px 20px calc(env(safe-area-inset-bottom, 4px) + 28px)`,
              }}>
              <div style={{ width: 36, height: 4, background: T.border, borderRadius: 2, margin: '0 auto 22px' }} />
              <h3 style={{ margin: '0 0 22px', fontSize: 18, fontWeight: 800, color: T.text }}>Edit plant</h3>

              <p style={{ margin: '0 0 7px', fontSize: 12, fontWeight: 600, color: T.muted }}>Nickname</p>
              <input
                value={editNickname}
                onChange={e => setEditNickname(e.target.value)}
                placeholder={`e.g. My big ${plant.plant_name}`}
                style={{
                  width: '100%', padding: '12px 14px', fontSize: 15,
                  borderRadius: T.rSm,
                  border: T.glassCardBd,
                  background: 'rgba(255,255,255,0.80)',
                  color: T.text, outline: 'none', marginBottom: 20, display: 'block', boxSizing: 'border-box',
                }}
              />

              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: T.muted }}>Light level</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                {LIGHTS.map(l => (
                  <motion.button
                    key={l.key}
                    onClick={() => setEditLight(l.key)}
                    whileTap={{ scale: 0.96 }} transition={SPRING_TAP}
                    style={{
                      flex: 1, padding: '10px 4px 12px',
                      borderRadius: T.rSm, textAlign: 'center',
                      border: editLight === l.key ? `2px solid ${T.green}` : T.glassCardBd,
                      background: editLight === l.key ? 'rgba(46,125,50,0.08)' : 'rgba(255,255,255,0.70)',
                      boxShadow: T.glassCardSh,
                      cursor: 'pointer',
                    }}>
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{l.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{l.label}</div>
                    <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>{l.sub}</div>
                  </motion.button>
                ))}
              </div>

              <motion.button
                onClick={saveEdit}
                disabled={saving}
                whileTap={{ scale: 0.97 }} transition={SPRING_TAP}
                style={{
                  width: '100%', padding: 15,
                  background: saving ? T.greenLight : T.green,
                  color: saving ? T.muted : '#fff',
                  border: 'none', borderRadius: T.rSm,
                  fontSize: 15, fontWeight: 600,
                  cursor: saving ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                {saving ? <><Spinner size={16} light /> Saving…</> : 'Save changes'}
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Delete confirmation ── */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setDeleteConfirm(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.40)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={SPRING_SHEET}
              onClick={e => e.stopPropagation()}
              style={{
                position: 'fixed', inset: 0, zIndex: 201,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
                pointerEvents: 'none',
              }}>
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  background: T.glassChromeBase,
                  backdropFilter: T.glassChromeBlur,
                  WebkitBackdropFilter: T.glassChromeBlur,
                  border: T.glassChromeBd,
                  boxShadow: T.glassPanelSh,
                  borderRadius: T.r, padding: 28,
                  width: '100%', maxWidth: 340,
                  pointerEvents: 'auto',
                }}>
                <div style={{ textAlign: 'center', marginBottom: 22 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: T.dangerLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.danger} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: T.text }}>
                    Remove {plant.nickname || plant.plant_name}?
                  </h3>
                  <p style={{ margin: 0, fontSize: 14, color: T.sub, lineHeight: 1.55 }}>
                    This will permanently delete the plant and all its care history.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <motion.button
                    onClick={() => setDeleteConfirm(false)}
                    whileTap={{ scale: 0.97 }} transition={SPRING_TAP}
                    style={{
                      flex: 1, padding: 13,
                      background: T.glassCard, color: T.text,
                      border: T.glassCardBd, boxShadow: T.glassCardSh,
                      borderRadius: T.rSm, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    }}>
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={deletePlant}
                    disabled={deleting}
                    whileTap={{ scale: 0.97 }} transition={SPRING_TAP}
                    style={{
                      flex: 1, padding: 13,
                      background: T.danger, color: '#fff',
                      border: 'none', borderRadius: T.rSm,
                      fontSize: 14, fontWeight: 700,
                      cursor: deleting ? 'default' : 'pointer',
                      opacity: deleting ? 0.7 : 1,
                    }}>
                    {deleting ? 'Removing…' : 'Remove'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Nav />
    </main>
  );
}
