'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { computeWatering, nextWateringDate, type LightLevel } from '@/lib/careEngine';
import { Nav } from '@/components/Nav';
import { T } from '@/lib/theme';

type Plant = {
  id: string; plant_name: string; nickname: string | null;
  image_urls: string[]; illustration_url: string | null;
  next_watering_due: string | null; last_watered: string | null;
  light_level: string | null; watering_frequency: string;
};

const AVATAR_BG = ['#E8F5E9', '#E3F2FD', '#FFF3E0', '#FCE4EC', '#EDE7F6', '#E0F2F1'];
function avatarBg(name: string) {
  const n = (name.charCodeAt(0) ?? 65) + (name.charCodeAt(1) ?? 65);
  return AVATAR_BG[n % AVATAR_BG.length];
}

function parseLocalDate(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysFrom(dateStr: string) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((parseLocalDate(dateStr).getTime() - now.getTime()) / 86400000);
}

function dateLabel(dateStr: string) {
  const d = daysFrom(dateStr);
  if (d <= 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d <= 6) return parseLocalDate(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
  return parseLocalDate(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function PlantAvatar({ plant, size = 44 }: { plant: Plant; size?: number }) {
  const src   = plant.illustration_url || plant.image_urls?.[0];
  const isIll = !!plant.illustration_url;
  const init  = (plant.nickname || plant.plant_name).charAt(0).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: Math.round(size * 0.27), overflow: 'hidden', background: avatarBg(plant.plant_name), border: `1px solid ${T.border}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {src
        ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: isIll ? 'contain' : 'cover' }} />
        : <span style={{ fontSize: Math.round(size * 0.4), fontWeight: 800, color: T.green }}>{init}</span>
      }
    </div>
  );
}

export default function SchedulePage() {
  const router = useRouter();
  const [plants,  setPlants]  = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId,  setUserId]  = useState<string | null>(null);
  const [watering, setWatering] = useState<Set<string>>(new Set());
  const [watered,  setWatered]  = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      setUserId(data.user.id);
      load(data.user.id);
    });
  }, [router]);

  const load = async (uid: string) => {
    const { data } = await supabase.from('plants')
      .select('id, plant_name, nickname, image_urls, illustration_url, next_watering_due, last_watered, light_level, watering_frequency')
      .eq('user_id', uid).order('next_watering_due', { ascending: true });
    if (data) setPlants(data as Plant[]);
    setLoading(false);
  };

  const markWatered = async (p: Plant) => {
    if (!userId || watering.has(p.id) || watered.has(p.id)) return;
    setWatering(prev => new Set(prev).add(p.id));
    try {
      const engine = computeWatering({ baseWateringFrequency: p.watering_frequency, light: (p.light_level as LightLevel) ?? null, lat: null });
      const today  = new Date().toISOString().slice(0, 10);
      const due    = nextWateringDate(today, engine.intervalDays);
      await supabase.from('care_log').insert({ plant_id: p.id, user_id: userId, action: 'watered' });
      await supabase.from('plants').update({ last_watered: today, next_watering_due: due }).eq('id', p.id);
      setWatered(prev => new Set(prev).add(p.id));
      setTimeout(() => { setWatered(prev => { const s = new Set(prev); s.delete(p.id); return s; }); load(userId); }, 1500);
    } finally {
      setWatering(prev => { const s = new Set(prev); s.delete(p.id); return s; });
    }
  };

  // Group plants by date bucket
  const buckets = new Map<string, Plant[]>();
  const later: Plant[] = [];
  const noSched: Plant[] = [];

  plants.forEach(p => {
    if (!p.next_watering_due) { noSched.push(p); return; }
    const d = daysFrom(p.next_watering_due);
    if (d > 30) { later.push(p); return; }
    const key = p.next_watering_due;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(p);
  });

  const todayCount = [...buckets.entries()].filter(([k]) => daysFrom(k) <= 0).reduce((s, [, v]) => s + v.length, 0);

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: T.bg, paddingBottom: 88 }}>

      {/* Header */}
      <div style={{ background: T.surface, padding: '52px 20px 16px', borderBottom: `1px solid ${T.border}` }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: '0 0 3px', letterSpacing: -0.4 }}>Care Schedule</h1>
        <p style={{ fontSize: 13, color: T.sub, margin: 0 }}>
          {loading ? 'Loading…'
            : todayCount > 0 ? `${todayCount} plant${todayCount > 1 ? 's' : ''} need care today`
            : plants.length > 0 ? 'All plants are on track ✓'
            : 'No plants yet'}
        </p>
      </div>

      <div style={{ padding: '16px 14px 0' }}>

        {/* Skeleton */}
        {loading && [1, 2, 3].map((_, i) => (
          <div key={i} style={{ marginBottom: 24, opacity: 1 - i * 0.3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 70, height: 13, borderRadius: 5, background: T.border }} />
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>
            {[1, 2].map(j => (
              <div key={j} style={{ background: T.surface, borderRadius: T.rSm, padding: '12px 14px', border: `1px solid ${T.border}`, marginBottom: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: T.border, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: '60%', height: 14, borderRadius: 5, background: T.border, marginBottom: 6 }} />
                  <div style={{ width: '35%', height: 11, borderRadius: 4, background: T.border }} />
                </div>
                <div style={{ width: 72, height: 32, borderRadius: T.rPill, background: T.border }} />
              </div>
            ))}
          </div>
        ))}

        {/* Empty */}
        {!loading && plants.length === 0 && (
          <div style={{ textAlign: 'center', padding: '72px 24px' }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: T.greenLight, border: `1px solid ${T.greenMid}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 36 }}>📅</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: '0 0 8px' }}>No plants yet</p>
            <p style={{ fontSize: 14, color: T.sub, margin: 0, lineHeight: 1.6 }}>Add plants from the Scan tab<br />to build your care schedule</p>
          </div>
        )}

        {/* Date buckets */}
        {!loading && [...buckets.entries()].map(([dateStr, group]) => {
          const d = daysFrom(dateStr);
          return (
            <div key={dateStr} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.9, color: d <= 0 ? T.danger : d === 1 ? T.warn : T.text }}>
                  {dateLabel(dateStr)}
                </span>
                <div style={{ flex: 1, height: 1, background: T.border }} />
                <span style={{ fontSize: 11, color: T.muted, fontWeight: 500 }}>
                  {group.length} plant{group.length > 1 ? 's' : ''}
                </span>
              </div>

              {group.map(p => {
                const isDone = watered.has(p.id);
                const isBusy = watering.has(p.id);
                return (
                  <div key={p.id} style={{
                    background: isDone ? T.greenLight : T.surface,
                    border: `1px solid ${isDone ? T.greenMid : T.border}`,
                    borderRadius: T.rSm, padding: '12px 14px', marginBottom: 8,
                    display: 'flex', alignItems: 'center', gap: 12,
                    transition: 'background 0.2s, border-color 0.2s',
                  }}>
                    <div onClick={() => router.push(`/plant/${p.id}`)} style={{ cursor: 'pointer', flexShrink: 0 }}>
                      <PlantAvatar plant={p} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => router.push(`/plant/${p.id}`)}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: isDone ? T.green : T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {isDone && '✓ '}{p.nickname || p.plant_name}
                      </p>
                      <p style={{ margin: '3px 0 0', fontSize: 11, color: T.muted }}>
                        💧 Water {d <= 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d}d`}
                      </p>
                    </div>

                    {!isDone && (
                      <button onClick={() => markWatered(p)} disabled={isBusy}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
                          background: d <= 0 ? T.green : T.greenLight,
                          color: d <= 0 ? '#fff' : T.green,
                          border: `1px solid ${d <= 0 ? T.green : T.greenMid}`,
                          borderRadius: T.rPill, padding: '7px 14px',
                          fontSize: 12, fontWeight: 700,
                          cursor: isBusy ? 'default' : 'pointer', opacity: isBusy ? 0.7 : 1,
                        }}>
                        {isBusy
                          ? <div style={{ width: 12, height: 12, border: `2px solid ${T.shadowOverlay}`, borderTop: `2px solid ${d <= 0 ? '#fff' : T.green}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                          : <span>💧</span>
                        }
                        {!isBusy && 'Water'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Later (> 30 days) */}
        {!loading && later.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.9, color: T.muted }}>Later</span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>
            {later.map(p => (
              <div key={p.id} onClick={() => router.push(`/plant/${p.id}`)}
                style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rSm, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <PlantAvatar plant={p} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nickname || p.plant_name}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: T.muted }}>
                    💧 {dateLabel(p.next_watering_due!)} · {daysFrom(p.next_watering_due!)}d away
                  </p>
                </div>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            ))}
          </div>
        )}

        {/* No schedule */}
        {!loading && noSched.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.9, color: T.muted }}>No schedule</span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>
            {noSched.map(p => (
              <div key={p.id} onClick={() => router.push(`/plant/${p.id}`)}
                style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rSm, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <PlantAvatar plant={p} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.text }}>{p.nickname || p.plant_name}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: T.muted }}>Re-scan to set a watering schedule</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Nav />
    </main>
  );
}
