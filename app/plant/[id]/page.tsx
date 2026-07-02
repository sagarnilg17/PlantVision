'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { computeWatering, nextWateringDate, type LightLevel } from '@/lib/careEngine';
import { Nav } from '@/components/Nav';
import { T } from '@/lib/theme';

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

function Spinner({ size = 20 }: { size?: number }) {
  return <div style={{ width: size, height: size, border: `2px solid ${T.greenLight}`, borderTop: `2px solid ${T.green}`, borderRadius: '50%', animation: 'spin 0.75s linear infinite', flexShrink: 0 }} />;
}

const LOG_META: Record<string, { icon: string; label: string }> = {
  watered:    { icon: '💧', label: 'Watered' },
  fertilised: { icon: '🌱', label: 'Fertilised' },
  repotted:   { icon: '🪴', label: 'Repotted' },
};

export default function PlantDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [plant,    setPlant]    = useState<Plant | null>(null);
  const [logs,     setLogs]     = useState<CareLog[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [busy,     setBusy]     = useState(false);

  // Edit sheet
  const [editOpen,     setEditOpen]     = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editLight,    setEditLight]    = useState<LightLevel | null>(null);
  const [saving,       setSaving]       = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  const load = useCallback(async () => {
    const { data: p } = await supabase.from('plants').select('*').eq('id', id).single();
    if (p) setPlant(p as Plant);
    const { data: l } = await supabase.from('care_log').select('id, action, created_at').eq('plant_id', id).order('created_at', { ascending: false }).limit(10);
    if (l) setLogs(l as CareLog[]);
    const { data: ci } = await supabase.from('checkins').select('id, image_urls, created_at, notes').eq('plant_id', id).order('created_at', { ascending: false });
    if (ci) setCheckins(ci as Checkin[]);
  }, [id]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login'); else load();
    });
  }, [router, load]);

  const openEdit = () => {
    if (!plant) return;
    setEditNickname(plant.nickname ?? '');
    setEditLight((plant.light_level as LightLevel) ?? null);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!plant || saving) return;
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
    setDeleting(true);
    await supabase.from('care_log').delete().eq('plant_id', id);
    await supabase.from('checkins').delete().eq('plant_id', id);
    await supabase.from('plants').delete().eq('id', id);
    router.push('/');
  };

  const logAction = async (action: string) => {
    if (!plant) return;
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
      <main style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
        <Spinner size={28} />
        <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>Loading plant…</p>
      </main>
    );
  }

  const d       = plant.next_watering_due ? dayDiff(plant.next_watering_due) : null;
  const overdue = d !== null && d <= 0;

  const QUICK = [
    { action: 'watered',    icon: '💧', label: 'Watered' },
    { action: 'fertilised', icon: '🌱', label: 'Fertilised' },
    { action: 'repotted',   icon: '🪴', label: 'Repotted' },
  ];

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: T.bg, paddingBottom: 88 }}>

      {/* Hero */}
      <div style={{ background: T.surface, paddingTop: 48, position: 'relative', borderBottom: `1px solid ${T.border}` }}>
        <button onClick={() => router.push('/')}
          style={{ position: 'absolute', top: 16, left: 16, width: 38, height: 38, background: T.bg, border: `1px solid ${T.border}`, borderRadius: '50%', fontSize: 17, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ←
        </button>

        {/* Edit button */}
        <button onClick={openEdit}
          style={{ position: 'absolute', top: 16, right: 16, width: 38, height: 38, background: T.bg, border: `1px solid ${T.border}`, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-end', padding: '8px 20px 0' }}>
          {(plant.illustration_url || plant.image_urls?.[0]) && (
            <div style={{ flexShrink: 0, width: 140, height: 140, marginBottom: -20, zIndex: 2 }}>
              <img src={plant.illustration_url || plant.image_urls[0]} alt={plant.plant_name}
                style={{ width: '100%', height: '100%', objectFit: plant.illustration_url ? 'contain' : 'cover', borderRadius: plant.illustration_url ? 0 : 20, filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.09))' }} />
            </div>
          )}
          <div style={{ flex: 1, paddingBottom: 20, paddingLeft: 16 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: '0 0 4px', lineHeight: 1.2, letterSpacing: -0.3 }}>
              {plant.nickname || plant.plant_name}
            </h1>
            <p style={{ fontSize: 13, color: T.muted, margin: '0 0 10px', fontStyle: 'italic' }}>{plant.scientific_name}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: T.sub, background: T.bg, border: `1px solid ${T.border}`, borderRadius: T.rPill, padding: '3px 9px', fontWeight: 500 }}>
                {plant.confidence} match
              </span>
              {plant.light_level && (
                <span style={{ fontSize: 11, color: T.sub, background: T.bg, border: `1px solid ${T.border}`, borderRadius: T.rPill, padding: '3px 9px', fontWeight: 500 }}>
                  {plant.light_level === 'low' ? '🌥️' : plant.light_level === 'medium' ? '⛅' : '☀️'} {plant.light_level}
                </span>
              )}
            </div>
          </div>
        </div>

        {plant.image_urls?.length > 0 && (
          <div style={{ display: 'flex', gap: 8, padding: '24px 20px 16px', overflowX: 'auto' }}>
            {plant.image_urls.map((url, i) => (
              <div key={i} style={{ flexShrink: 0, width: 90, height: 90, borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Watering status */}
        <div style={{ background: overdue ? T.amberLight : T.greenLight, border: `1px solid ${overdue ? T.amberBorder : T.borderMid}`, borderRadius: T.r, padding: 16, boxShadow: T.shadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: overdue ? T.amberText : T.greenDark }}>
              {d === null ? 'No watering schedule yet' : d <= 0 ? '💧 Needs water today' : `💧 Next water in ${d} day${d !== 1 ? 's' : ''}`}
            </p>
            {plant.watering_frequency && (
              <span style={{ fontSize: 11, color: T.sub, background: 'rgba(255,255,255,0.7)', border: `1px solid ${overdue ? T.amberBorder : T.borderMid}`, borderRadius: T.rPill, padding: '2px 8px', whiteSpace: 'nowrap', marginLeft: 8, flexShrink: 0 }}>
                {plant.watering_frequency}
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: T.sub }}>{plant.watering_tips}</p>
        </div>

        {/* Quick log */}
        <div>
          <p style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px', fontWeight: 700 }}>Quick log</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {QUICK.map(q => (
              <button key={q.action} onClick={() => logAction(q.action)} disabled={busy}
                style={{ flex: 1, padding: '12px 4px 14px', borderRadius: T.rSm, textAlign: 'center', border: `1px solid ${T.border}`, background: T.surface, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1, boxShadow: T.shadow, transition: 'opacity 0.15s' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{q.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{q.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Re-scan */}
        <button onClick={() => router.push(`/scan?recheck=${id}`)}
          style={{ width: '100%', padding: 14, background: T.surface, color: T.green, border: `1.5px solid ${T.green}`, borderRadius: T.rSm, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Re-scan &amp; Update Health
        </button>

        {/* Toxicity */}
        {plant.toxicity_info && (() => {
          try {
            const tox = JSON.parse(plant.toxicity_info);
            const isToxic = tox.animals || tox.humans;
            return (
              <div style={{
                background: isToxic ? T.dangerLight : T.greenLight,
                border: `1px solid ${isToxic ? T.dangerBorder : T.greenMid}`,
                borderRadius: T.r, padding: 14, boxShadow: T.shadow,
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{isToxic ? '⚠️' : '✅'}</span>
                <div>
                  <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: isToxic ? T.danger : T.green }}>
                    {isToxic ? 'Toxic' : 'Non-toxic'}
                    {tox.animals && tox.humans ? ' to pets & humans' : tox.animals ? ' to pets' : tox.humans ? ' to humans' : ''}
                  </p>
                  {tox.notes && <p style={{ margin: 0, fontSize: 13, color: T.sub, lineHeight: 1.5 }}>{tox.notes}</p>}
                </div>
              </div>
            );
          } catch { return null; }
        })()}

        {/* Care guide */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r, padding: 16, boxShadow: T.shadow }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Care guide</p>
          <div style={{ marginBottom: 10 }}>
            <p style={{ margin: '0 0 2px', fontSize: 13, color: T.text, fontWeight: 600 }}>🪴 {plant.pot_size}</p>
            {plant.pot_size_reason && (
              <p style={{ margin: 0, fontSize: 12, color: T.sub, lineHeight: 1.5 }}>{plant.pot_size_reason}</p>
            )}
          </div>
          {plant.care_tips?.map((tip, i) => (
            <p key={i} style={{ margin: '6px 0 0', fontSize: 13, color: T.text, lineHeight: 1.5 }}>• {tip}</p>
          ))}
        </div>

        {/* Activity log */}
        {logs.length > 0 && (
          <div>
            <p style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px', fontWeight: 700 }}>Recent activity</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {logs.map(l => {
                const meta = LOG_META[l.action] ?? { icon: '•', label: l.action };
                return (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rSm, boxShadow: T.shadow }}>
                    <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{meta.icon} {meta.label}</span>
                    <span style={{ fontSize: 12, color: T.muted }}>
                      {new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Growth timeline */}
        {checkins.length > 0 && (
          <div>
            <p style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px', fontWeight: 700 }}>Growth timeline</p>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {checkins.map(ci => (
                <div key={ci.id} style={{ flexShrink: 0, width: 88 }}>
                  <div style={{ width: 88, height: 88, borderRadius: T.rSm, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                    <img src={ci.image_urls?.[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <p style={{ margin: '5px 0 0', fontSize: 10, color: T.muted, textAlign: 'center' }}>
                    {new Date(ci.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Remove plant */}
        <button onClick={() => setDeleteConfirm(true)}
          style={{ width: '100%', padding: 13, background: T.surface, color: T.danger, border: `1px solid ${T.dangerBorder}`, borderRadius: T.rSm, fontSize: 14, fontWeight: 500, cursor: 'pointer', marginTop: 6 }}>
          Remove plant
        </button>
      </div>

      {/* ── Edit sheet ── */}
      {editOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setEditOpen(false)}>
          <div
            style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: '#fff', borderRadius: '24px 24px 0 0', padding: `24px 20px calc(env(safe-area-inset-bottom, 4px) + 28px)`, boxShadow: '0 -8px 32px rgba(0,0,0,0.12)', animation: 'fadeUp 0.22s ease' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, background: T.border, borderRadius: 2, margin: '0 auto 22px' }} />
            <h3 style={{ margin: '0 0 22px', fontSize: 18, fontWeight: 800, color: T.text }}>Edit plant</h3>

            <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.7, display: 'block', marginBottom: 7 }}>Nickname</label>
            <input value={editNickname} onChange={e => setEditNickname(e.target.value)}
              placeholder={`e.g. My big ${plant.plant_name}`}
              style={{ width: '100%', padding: '12px 14px', fontSize: 15, borderRadius: T.rSm, border: `1.5px solid ${T.border}`, background: T.bg, color: T.text, outline: 'none', marginBottom: 20, display: 'block' }} />

            <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.7, display: 'block', marginBottom: 10 }}>Light level</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {LIGHTS.map(l => (
                <button key={l.key} onClick={() => setEditLight(l.key)}
                  style={{ flex: 1, padding: '10px 4px 12px', borderRadius: T.rSm, textAlign: 'center', border: `2px solid ${editLight === l.key ? T.green : T.border}`, background: editLight === l.key ? T.greenLight : T.surface, cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{l.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{l.label}</div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>{l.sub}</div>
                </button>
              ))}
            </div>

            <button onClick={saveEdit} disabled={saving}
              style={{ width: '100%', padding: 15, background: saving ? T.greenMid : T.green, color: saving ? T.muted : '#fff', border: 'none', borderRadius: T.rSm, fontSize: 15, fontWeight: 600, cursor: saving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {saving ? <><Spinner /> Saving…</> : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setDeleteConfirm(false)}>
          <div style={{ background: '#fff', borderRadius: T.r, padding: 28, width: '100%', maxWidth: 340, boxShadow: T.shadowMd, animation: 'fadeUp 0.18s ease' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: T.dangerLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.danger} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
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
              <button onClick={() => setDeleteConfirm(false)}
                style={{ flex: 1, padding: 13, background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: T.rSm, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={deletePlant} disabled={deleting}
                style={{ flex: 1, padding: 13, background: T.danger, color: '#fff', border: 'none', borderRadius: T.rSm, fontSize: 14, fontWeight: 700, cursor: deleting ? 'default' : 'pointer', opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Nav />
    </main>
  );
}
