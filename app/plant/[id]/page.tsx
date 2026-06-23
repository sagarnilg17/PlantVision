'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { computeWatering, nextWateringDate, type LightLevel } from '@/lib/careEngine';

type Plant = {
  id: string; plant_name: string; nickname: string | null; scientific_name: string;
  image_urls: string[]; next_watering_due: string | null; last_watered: string | null;
  light_level: string | null; watering_frequency: string; watering_tips: string;
  pot_size: string; pot_size_reason: string; care_tips: string[]; confidence: string;
};
type CareLog = { id: string; action: string; created_at: string };
type Checkin = { id: string; image_urls: string[]; created_at: string; notes: string | null };

const C = {
  bg: '#F7FBF7', surface: '#FFFFFF', border: '#D5E5D5',
  green: '#2E7D32', greenLight: '#E3F2E3', text: '#1A2E1A',
  sub: '#5A6B5A', danger: '#C0392B', warn: '#E67E22',
};
const dayDiff = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

export default function PlantDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data: p } = await supabase.from('plants').select('*').eq('id', id).single();
    if (p) setPlant(p as Plant);
    const { data: l } = await supabase.from('care_log').select('id, action, created_at').eq('plant_id', id).order('created_at', { ascending: false }).limit(10);
    if (l) setLogs(l as CareLog[]);
    const { data: ci } = await supabase.from('checkins').select('id, image_urls, created_at, notes').eq('plant_id', id).order('created_at', { ascending: false });
    if (ci) setCheckins(ci as Checkin[]);
  }, [id]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (!data.user) router.push('/login'); else load(); });
  }, [router, load]);

  const logAction = async (action: string) => {
    if (!plant) return;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from('care_log').insert({ plant_id: id, user_id: u.user.id, action });

    // if watered, recompute next due using the care engine
    if (action === 'watered') {
      const engine = computeWatering({ baseWateringFrequency: plant.watering_frequency, light: (plant.light_level as LightLevel) ?? null, lat: null });
      const today = new Date().toISOString().slice(0, 10);
      const due = nextWateringDate(today, engine.intervalDays);
      await supabase.from('plants').update({ last_watered: today, next_watering_due: due }).eq('id', id);
    }
    await load();
    setBusy(false);
  };

  if (!plant) return <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.sub }}>Loading…</main>;

  const d = plant.next_watering_due ? dayDiff(plant.next_watering_due) : null;
  const QUICK = [
    { action: 'watered', icon: '💧', label: 'Watered' },
    { action: 'fertilised', icon: '🌱', label: 'Fertilised' },
    { action: 'repotted', icon: '🪴', label: 'Repotted' },
  ];

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 80px', minHeight: '100vh', background: C.bg }}>
      {/* Hero image */}
      <div style={{ position: 'relative', aspectRatio: '4/3', background: C.greenLight }}>
        <img src={plant.image_urls?.[0]} alt={plant.plant_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <button onClick={() => router.push('/')} style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 20, width: 38, height: 38, fontSize: 18, cursor: 'pointer' }}>←</button>
      </div>

      <div style={{ padding: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>{plant.nickname || plant.plant_name}</h1>
        <p style={{ fontSize: 13, color: C.sub, fontStyle: 'italic', margin: '2px 0 0' }}>{plant.scientific_name} · {plant.confidence} match</p>

        {/* Watering status */}
        <div style={{ background: d !== null && d <= 0 ? '#FFF6E5' : C.greenLight, border: `1px solid ${d !== null && d <= 0 ? '#F0C36D' : C.border}`, borderRadius: 12, padding: 14, margin: '16px 0' }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: d !== null && d <= 0 ? '#8A6D1A' : C.green }}>
            {d === null ? 'No schedule yet' : d <= 0 ? '💧 Needs water now' : `💧 Next water in ${d} day${d > 1 ? 's' : ''}`}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: C.sub }}>{plant.watering_tips}</p>
        </div>

        {/* Quick-log */}
        <p style={{ fontSize: 13, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 8px' }}>Quick log</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {QUICK.map(q => (
            <button key={q.action} onClick={() => logAction(q.action)} disabled={busy}
              style={{ flex: 1, padding: '12px 4px', borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>
              <div style={{ fontSize: 22 }}>{q.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginTop: 2 }}>{q.label}</div>
            </button>
          ))}
        </div>

        {/* Re-scan */}
        <button onClick={() => router.push(`/scan?recheck=${id}`)}
          style={{ width: '100%', padding: 14, background: C.green, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 20 }}>
          📷 Re-scan & Update Health
        </button>

        {/* Care card */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 20 }}>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: C.sub, textTransform: 'uppercase' }}>Care guide</p>
          <p style={{ margin: '0 0 4px', fontSize: 13, color: C.text }}>🪴 {plant.pot_size}</p>
          {plant.care_tips?.map((t, i) => <p key={i} style={{ margin: '4px 0 0', fontSize: 13, color: C.text }}>• {t}</p>)}
        </div>

        {/* History */}
        {logs.length > 0 && (
          <>
            <p style={{ fontSize: 13, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 8px' }}>Recent activity</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {logs.map(l => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.text, padding: '8px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8 }}>
                  <span style={{ textTransform: 'capitalize' }}>{l.action === 'watered' ? '💧' : l.action === 'fertilised' ? '🌱' : '🪴'} {l.action}</span>
                  <span style={{ color: C.sub }}>{new Date(l.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Check-in photo timeline */}
        {checkins.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 13, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 8px' }}>Growth timeline</p>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
              {checkins.map(ci => (
                <div key={ci.id} style={{ flexShrink: 0, width: 90 }}>
                  <img src={ci.image_urls?.[0]} alt="" style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 10, border: `1px solid ${C.border}` }} />
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: C.sub, textAlign: 'center' }}>{new Date(ci.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
