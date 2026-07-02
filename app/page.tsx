'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { computeWatering, nextWateringDate, type LightLevel } from '@/lib/careEngine';
import { Nav } from '@/components/Nav';
import { InstallBanner } from '@/components/InstallBanner';
import { PermaTipsCarousel } from '@/components/PermaTipsCarousel';
import { T } from '@/lib/theme';

const SPRING = { type: 'spring' as const, stiffness: 340, damping: 36 };

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

function PlantAvatar({ plant, size = 88 }: { plant: Plant; size?: number }) {
  const src   = plant.illustration_url || plant.image_urls?.[0] || null;
  const isIll = !!plant.illustration_url;
  const initial = (plant.nickname || plant.plant_name).charAt(0).toUpperCase();
  const radius  = Math.round(size * 0.2);

  if (!src) {
    return (
      <div style={{ width: size, height: size, flexShrink: 0, background: avatarBg(plant.plant_name), borderRadius: radius, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${T.border}` }}>
        <span style={{ fontSize: size * 0.40, fontWeight: 800, color: T.green, lineHeight: 1 }}>{initial}</span>
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, flexShrink: 0, borderRadius: radius, overflow: 'hidden', border: `1px solid ${T.border}`, background: isIll ? '#fff' : T.greenLight }}>
      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: isIll ? 'contain' : 'cover' }} />
    </div>
  );
}

function PlantCard({ p, onClick, idx, userId, onRefresh }: {
  p: Plant; onClick: () => void; idx: number;
  userId: string; onRefresh: () => void;
}) {
  const [watering, setWatering] = useState(false);
  const [watered,  setWatered]  = useState(false);

  const d       = p.next_watering_due ? dayDiff(p.next_watering_due) : null;
  const overdue = d !== null && d <= 0;
  const hm      = healthMeta(p.plant_health);
  const firstNote = p.plant_health_details ? p.plant_health_details.split(';')[0].trim() : null;

  const quickWater = async (e: React.MouseEvent | React.TouchEvent) => {
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
      onClick={onClick}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ ...SPRING, delay: idx * 0.05 }}
      whileTap={{ scale: 0.975 }}
      whileHover={{ y: -2 }}
      style={{
        background: T.surface, borderRadius: T.r, border: `1px solid ${T.border}`,
        boxShadow: T.shadowMd,
        marginBottom: 14, cursor: 'pointer',
        display: 'flex', alignItems: 'stretch', overflow: 'hidden',
      }}>

      {/* Avatar */}
      <div style={{ padding: 16, paddingRight: 0, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <PlantAvatar plant={p} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '16px 10px 16px 14px', minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.nickname || p.plant_name}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: T.muted, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.nickname ? p.plant_name : (p.scientific_name ?? '')}
        </p>

        {/* Watering row + quick water button */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {d !== null && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: overdue ? T.amberLight : T.greenLight,
              color: overdue ? T.amberText : T.green,
              border: `1px solid ${overdue ? T.amberBorder : T.greenMid}`,
              borderRadius: T.rPill, padding: '4px 10px',
              fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
            }}>
              💧 {d <= 0 ? 'Water now' : `in ${d}d`}
            </span>
          )}

          {/* Quick water button — shown when overdue */}
          {overdue && (
            <button
              onClick={quickWater}
              onTouchEnd={quickWater}
              disabled={watering}
              style={{
                width: 30, height: 30, borderRadius: '50%',
                background: watered ? T.green : T.green,
                color: '#fff', border: 'none', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: watering ? 'default' : 'pointer',
                boxShadow: watered ? 'none' : '0 2px 8px rgba(46,125,50,0.4)',
                fontSize: 13,
                transition: 'transform 0.12s ease',
                transform: watered ? 'scale(1.15)' : 'scale(1)',
              }}>
              {watering
                ? <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : watered ? '✓' : '💧'
              }
            </button>
          )}

          {p.light_level && (
            <span style={{ fontSize: 14, color: T.muted }}>
              {p.light_level === 'low' ? '🌥️' : p.light_level === 'medium' ? '⛅' : '☀️'}
            </span>
          )}
        </div>

        {/* Health */}
        {hm && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: hm.bg, color: hm.color, border: `1px solid ${hm.border}`,
              borderRadius: T.rPill, padding: '3px 9px', fontSize: 11, fontWeight: 700,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: hm.color, flexShrink: 0 }} />
              {hm.label}
            </span>
            {firstNote && (
              <p style={{ margin: '5px 0 0', fontSize: 11, color: T.sub, lineHeight: 1.45 }}>{firstNote}</p>
            )}
          </div>
        )}
      </div>

      {/* Chevron */}
      <div style={{ display: 'flex', alignItems: 'center', paddingRight: 14, color: T.muted, flexShrink: 0 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: T.surface, borderRadius: T.r, border: `1px solid ${T.border}`, marginBottom: 12, display: 'flex', padding: 14, gap: 12, boxShadow: T.shadow }}>
      <div style={{ width: 88, height: 88, borderRadius: 18, background: T.border, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ width: '65%', height: 17, borderRadius: 6, background: T.border, marginBottom: 8 }} />
        <div style={{ width: '40%', height: 12, borderRadius: 5, background: T.border, marginBottom: 12 }} />
        <div style={{ width: 88, height: 26, borderRadius: T.rPill, background: T.border }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [plants,   setPlants]   = useState<Plant[]>([]);
  const [checking, setChecking] = useState(true);
  const [name,     setName]     = useState('');
  const [userId,   setUserId]   = useState<string | null>(null);
  const [search,   setSearch]   = useState('');

  const load = useCallback(async (uid: string) => {
    const { data } = await supabase.from('plants')
      .select('id, plant_name, nickname, scientific_name, image_urls, next_watering_due, light_level, plant_health, plant_health_details, illustration_url, watering_frequency')
      .eq('user_id', uid).order('next_watering_due', { ascending: true });
    if (data) setPlants(data as Plant[]);
    setChecking(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      setUserId(data.user.id);
      setName(data.user.email?.split('@')[0] ?? '');
      load(data.user.id);
    });
  }, [router, load]);

  const due   = plants.filter(p => p.next_watering_due && dayDiff(p.next_watering_due) <= 0);
  const soon  = plants.filter(p => p.next_watering_due && dayDiff(p.next_watering_due) === 1);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const initials = name.charAt(0).toUpperCase();

  const q = search.trim().toLowerCase();
  const filtered = q
    ? plants.filter(p =>
        (p.nickname ?? '').toLowerCase().includes(q) ||
        p.plant_name.toLowerCase().includes(q)
      )
    : plants;

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: T.bg, paddingBottom: 88 }}>

      {/* Header */}
      <div style={{ background: T.surface, padding: '56px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 18 }}>
          <div>
            <p style={{ fontSize: 12, color: T.muted, margin: '0 0 3px', letterSpacing: 0.3 }}>{today}</p>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: '0 0 3px', lineHeight: 1.15, letterSpacing: -0.4 }}>My Garden</h1>
            <p style={{ fontSize: 13, color: T.sub, margin: 0 }}>Hey, {name} 👋</p>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${T.green}, ${T.greenDark})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, flexShrink: 0, marginTop: 4, boxShadow: T.shadowGreen }}>
            {initials || '?'}
          </div>
        </div>

        {!checking && plants.length > 0 && (
          <div style={{ display: 'flex', borderTop: `1px solid ${T.border}` }}>
            {[
              { value: plants.length,              label: 'Plants',      color: T.text },
              { value: due.length,                 label: 'Water today', color: due.length > 0 ? T.warn : T.sub },
              { value: plants.length - due.length, label: 'Thriving',    color: T.green },
            ].map((s, i, arr) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING, delay: 0.1 + i * 0.06 }}
                style={{ flex: 1, padding: '14px 0', textAlign: 'center', borderRight: i < arr.length - 1 ? `1px solid ${T.border}` : 'none' }}
              >
                <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</p>
                <p style={{ margin: '2px 0 0', fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 600 }}>{s.label}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '20px 16px 0' }}>

        {/* PWA install prompt */}
        {!checking && <InstallBanner />}

        {/* Permaculture tips carousel */}
        {!checking && <PermaTipsCarousel plants={plants} />}

        {/* Skeleton */}
        {checking && [1, 2, 3].map((_, i) => (
          <div key={i} style={{ opacity: 1 - i * 0.25 }}><SkeletonCard /></div>
        ))}

        {/* Watering urgency strip */}
        {!checking && due.length > 0 && (
          <div style={{ background: T.amberLight, border: `1px solid ${T.amberBorder}`, borderRadius: T.r, padding: 16, marginBottom: 20, boxShadow: T.shadow }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
              <span style={{ fontSize: 17 }}>💧</span>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.amberText }}>
                {due.length} plant{due.length > 1 ? 's' : ''} need watering today
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2 }}>
              {due.map(p => {
                const src = p.illustration_url || p.image_urls?.[0];
                const initial = (p.nickname || p.plant_name).charAt(0).toUpperCase();
                return (
                  <div key={p.id} onClick={() => router.push(`/plant/${p.id}`)}
                    style={{ flexShrink: 0, cursor: 'pointer', textAlign: 'center', width: 58 }}>
                    <div style={{ width: 58, height: 58, borderRadius: 15, overflow: 'hidden', background: avatarBg(p.plant_name), border: `2px solid ${T.amberBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {src
                        ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: p.illustration_url ? 'contain' : 'cover' }} />
                        : <span style={{ fontSize: 22, fontWeight: 800, color: T.green }}>{initial}</span>
                      }
                    </div>
                    <p style={{ margin: '5px 0 0', fontSize: 10, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {p.nickname || p.plant_name}
                    </p>
                  </div>
                );
              })}
            </div>
            {soon.length > 0 && (
              <p style={{ margin: '10px 0 0', fontSize: 12, color: T.sub }}>{soon.length} more due tomorrow</p>
            )}
          </div>
        )}

        {/* Search bar — only when there are enough plants */}
        {!checking && plants.length > 3 && (
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search plants…"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 34px 10px 36px', fontSize: 14, borderRadius: T.rSm,
                border: `1.5px solid ${search ? T.green : T.border}`,
                background: T.surface, color: T.text, outline: 'none',
                transition: 'border-color 0.15s',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: T.border, border: 'none', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.sub, fontSize: 12, fontWeight: 700 }}>
                ×
              </button>
            )}
          </div>
        )}

        {/* Section label */}
        {!checking && plants.length > 0 && (
          <p style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: 1.2, margin: '0 0 12px', fontWeight: 700 }}>
            {search ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}` : `All plants · ${plants.length}`}
          </p>
        )}

        {/* Empty state */}
        {!checking && plants.length === 0 && (
          <div style={{ textAlign: 'center', padding: '72px 24px 48px' }}>
            <div style={{ width: 100, height: 100, borderRadius: 28, background: T.greenLight, border: `1px solid ${T.greenMid}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg width="52" height="52" viewBox="0 0 64 64" fill="none">
                <path d="M32 10C32 10,15 25,15 39C15 48.8 22.7 56 32 56C41.3 56 49 48.8 49 39C49 25 32 10 32 10Z" fill={T.green} opacity="0.85"/>
                <line x1="32" y1="22" x2="32" y2="56" stroke={T.greenDark} strokeWidth="2.2" strokeLinecap="round" opacity="0.45"/>
                <path d="M32 36C32 36,23 31,21 38" stroke={T.greenDark} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.45"/>
                <path d="M32 46C32 46,41 41,43 48" stroke={T.greenDark} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.45"/>
              </svg>
            </div>
            <p style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: '0 0 8px', letterSpacing: -0.3 }}>Start your garden</p>
            <p style={{ fontSize: 14, color: T.sub, margin: '0 0 28px', lineHeight: 1.65 }}>
              Scan any plant to identify it,<br />build your collection and track care
            </p>
            <button onClick={() => router.push('/scan')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: T.green, color: '#fff', border: 'none', borderRadius: T.rPill, padding: '13px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: T.shadowGreen }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              Scan a plant
            </button>
          </div>
        )}

        {/* No search results */}
        {!checking && search && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 24px' }}>
            <p style={{ fontSize: 15, color: T.sub, margin: 0 }}>No plants matching "{search}"</p>
          </div>
        )}

        {/* Plant cards */}
        {!checking && plants.length > 0 && userId && (
          <AnimatePresence>
            {filtered.map((p, i) => (
              <PlantCard
                key={p.id} p={p} idx={i}
                onClick={() => router.push(`/plant/${p.id}`)}
                userId={userId}
                onRefresh={() => load(userId)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      <Nav />
    </main>
  );
}
