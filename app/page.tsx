'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Plant = {
  id: string; plant_name: string; nickname: string | null;
  image_urls: string[]; next_watering_due: string | null;
  light_level: string | null; plant_health: string | null;
};

const C = {
  bg: '#F7FBF7', surface: '#FFFFFF', border: '#D5E5D5',
  green: '#2E7D32', greenLight: '#E3F2E3', text: '#1A2E1A',
  sub: '#5A6B5A', danger: '#C0392B', warn: '#E67E22',
};

const dayDiff = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

export default function Dashboard() {
  const router = useRouter();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      setName(data.user.email?.split('@')[0] ?? '');
      load(data.user.id);
    });
  }, [router]);

  const load = async (uid: string) => {
    const { data } = await supabase.from('plants')
      .select('id, plant_name, nickname, image_urls, next_watering_due, light_level, plant_health')
      .eq('user_id', uid).order('next_watering_due', { ascending: true });
    if (data) setPlants(data as Plant[]);
    setChecking(false);
  };

  if (checking) return <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.sub }}>Loading…</main>;

  // tasks: plants due today or overdue
  const due = plants.filter(p => p.next_watering_due && dayDiff(p.next_watering_due) <= 0);
  const soon = plants.filter(p => p.next_watering_due && dayDiff(p.next_watering_due) === 1);

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 100px', minHeight: '100vh', background: C.bg }}>

      {/* Greeting */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: C.sub, margin: 0 }}>Hello {name} 👋</p>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, margin: '2px 0 0' }}>Your garden</h1>
      </div>

      {/* Today's tasks */}
      <div style={{ background: due.length ? '#FFF6E5' : C.greenLight, border: `1px solid ${due.length ? '#F0C36D' : C.border}`, borderRadius: 14, padding: 16, marginBottom: 20 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: due.length ? '#8A6D1A' : C.green }}>
          {due.length ? `💧 ${due.length} plant${due.length > 1 ? 's' : ''} need water today` : '✓ All plants are happy today'}
        </p>
        {due.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto' }}>
            {due.map(p => (
              <div key={p.id} onClick={() => router.push(`/plant/${p.id}`)} style={{ flexShrink: 0, cursor: 'pointer', textAlign: 'center', width: 64 }}>
                <img src={p.image_urls?.[0]} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 12, border: '2px solid #F0C36D' }} />
                <p style={{ margin: '4px 0 0', fontSize: 11, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nickname || p.plant_name}</p>
              </div>
            ))}
          </div>
        )}
        {soon.length > 0 && <p style={{ margin: '10px 0 0', fontSize: 12, color: C.sub }}>🔜 {soon.length} due tomorrow</p>}
      </div>

      {/* Plant grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p style={{ fontSize: 13, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.8, margin: 0 }}>All plants ({plants.length})</p>
      </div>

      {plants.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: C.sub }}>
          <div style={{ fontSize: 40 }}>🌱</div>
          <p style={{ fontSize: 14 }}>No plants yet. Scan your first one!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {plants.map(p => {
            const d = p.next_watering_due ? dayDiff(p.next_watering_due) : null;
            return (
              <div key={p.id} onClick={() => router.push(`/plant/${p.id}`)}
                style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer' }}>
                <div style={{ aspectRatio: '1', background: C.greenLight }}>
                  <img src={p.image_urls?.[0]} alt={p.plant_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: 10 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nickname || p.plant_name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: d !== null && d <= 0 ? C.danger : C.green }}>
                    {d === null ? '—' : d <= 0 ? '💧 Water now' : `💧 ${d}d`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating scan button */}
      <button onClick={() => router.push('/scan')}
        style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: C.green, color: '#fff', border: 'none', borderRadius: 30, padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(46,125,50,0.4)', maxWidth: 448, width: 'calc(100% - 32px)' }}>
        📷 Scan a Plant
      </button>
    </main>
  );
}
