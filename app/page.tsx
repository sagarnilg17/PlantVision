'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Candidate = {
  scientificName: string; commonName: string;
  genus: string; family: string; score: number;
};
type Care = {
  wateringFrequency: string; wateringTips: string;
  potSize: string; potSizeReason: string; careTips: string[];
};
type Analysis = { candidates: Candidate[]; topMatch: Candidate; care: Care; remaining?: number };
type SavedPlant = { id: string; plant_name: string; image_urls: string[]; next_watering_due: string | null };

// organ hints matched to each guided angle (improves PlantNet accuracy)
const ANGLES = [
  { key: 'top', label: 'Top View', hint: 'Shoot straight down — show the leaves', organ: 'leaf' },
  { key: 'side', label: 'Side View', hint: 'Full plant from the side', organ: 'leaf' },
  { key: 'soil', label: 'Base & Soil', hint: 'Close to the stem base and soil', organ: 'bark' },
];

const C = {
  bg: '#F7FBF7', surface: '#FFFFFF', border: '#D5E5D5',
  green: '#2E7D32', greenLight: '#E3F2E3', text: '#1A2E1A',
  sub: '#5A6B5A', danger: '#C0392B', warn: '#E67E22',
};

const confColor = (s: number) => (s >= 0.5 ? C.green : s >= 0.2 ? C.warn : C.danger);
const pct = (s: number) => `${Math.round(s * 100)}%`;

export default function PlantCare() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const [streaming, setStreaming] = useState(false);
  const [shots, setShots] = useState<string[]>([]);
  const [angleIdx, setAngleIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [chosenIdx, setChosenIdx] = useState(0);   // which candidate the user confirms
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedPlant[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      setUserId(data.user.id); setChecking(false); loadPlants(data.user.id);
    });
  }, [router]);

  const loadPlants = async (uid: string) => {
    const { data } = await supabase.from('plants')
      .select('id, plant_name, image_urls, next_watering_due')
      .eq('user_id', uid).order('created_at', { ascending: false });
    if (data) setSaved(data as SavedPlant[]);
  };

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) { videoRef.current.srcObject = stream; setStreaming(true); }
    } catch { setError('Camera permission denied.'); }
  }, []);

  const stopCamera = useCallback(() => {
    const s = videoRef.current?.srcObject as MediaStream | null;
    s?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
  }, []);

  const captureAngle = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current; const c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    const img = c.toDataURL('image/jpeg', 0.85);
    const next = [...shots, img];
    setShots(next);
    if (next.length >= 3) { stopCamera(); setAngleIdx(0); }
    else setAngleIdx(next.length);
  }, [shots, stopCamera]);

  const reset = () => { setShots([]); setAngleIdx(0); setAnalysis(null); setChosenIdx(0); setError(null); };

  const analyse = async () => {
    if (shots.length < 3 || !userId) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: shots, organs: ANGLES.map(a => a.organ) }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data); setChosenIdx(0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally { setLoading(false); }
  };

  const confirmAndSave = async () => {
    if (!analysis || !userId) return;
    setLoading(true);
    try {
      const chosen = analysis.candidates[chosenIdx];
      const care = analysis.care;
      const urls: string[] = [];
      for (let i = 0; i < shots.length; i++) {
        const blob = await (await fetch(shots[i])).blob();
        const path = `${userId}/${Date.now()}_${ANGLES[i].key}.jpg`;
        const { error: upErr } = await supabase.storage.from('plant-photos').upload(path, blob);
        if (!upErr) urls.push(supabase.storage.from('plant-photos').getPublicUrl(path).data.publicUrl);
      }
      const days = parseInt(care.wateringFrequency.match(/\d+/)?.[0] ?? '5', 10);
      const due = new Date(); due.setDate(due.getDate() + days);

      await supabase.from('plants').insert({
        user_id: userId,
        plant_name: chosen.commonName, scientific_name: chosen.scientificName,
        confidence: pct(chosen.score),
        watering_frequency: care.wateringFrequency, watering_tips: care.wateringTips,
        pot_size: care.potSize, pot_size_reason: care.potSizeReason,
        care_tips: care.careTips, image_urls: urls,
        next_watering_due: due.toISOString().slice(0, 10),
      });
      await loadPlants(userId);
      reset();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally { setLoading(false); }
  };

  const signOut = async () => { await supabase.auth.signOut(); router.push('/login'); };

  if (checking) return <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.sub }}>Loading…</main>;

  const btn = (bg: string, full?: boolean): React.CSSProperties => ({
    background: bg, color: bg === C.surface ? C.green : '#fff',
    border: bg === C.surface ? `1px solid ${C.border}` : 'none', borderRadius: 10,
    padding: full ? 14 : '10px 16px', fontSize: full ? 15 : 13, fontWeight: 600,
    cursor: 'pointer', flexShrink: 0, width: full ? '100%' : undefined,
  });

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 80px', minHeight: '100vh', background: C.bg }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>🌿 Plant Care</h1>
          <p style={{ fontSize: 13, color: C.sub, margin: '2px 0 0' }}>Powered by botanical AI · first-pass guidance</p>
        </div>
        <button onClick={signOut} style={{ background: 'none', border: 'none', color: C.sub, fontSize: 13, cursor: 'pointer' }}>Sign out</button>
      </div>

      {/* Capture */}
      {!analysis && (
        <>
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#000', aspectRatio: '4/3', marginBottom: 12, border: `1px solid ${C.border}` }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: streaming ? 'block' : 'none' }} />
            {!streaming && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 8, background: C.greenLight }}>
                <span style={{ fontSize: 48 }}>🌱</span>
                <span style={{ color: C.sub, fontSize: 13 }}>3 angles → best identification</span>
              </div>
            )}
            {streaming && (
              <div style={{ position: 'absolute', top: 12, left: 12, right: 12, background: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: '8px 12px' }}>
                <p style={{ margin: 0, color: '#fff', fontSize: 13, fontWeight: 600 }}>📸 {ANGLES[angleIdx].label} ({shots.length + 1}/3)</p>
                <p style={{ margin: '2px 0 0', color: '#cfe', fontSize: 12 }}>{ANGLES[angleIdx].hint}</p>
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          {shots.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {ANGLES.map((a, i) => (
                <div key={a.key} style={{ flex: 1, aspectRatio: '1', borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden', background: C.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {shots[i] ? <img src={shots[i]} alt={a.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 11, color: C.sub, textAlign: 'center', padding: 4 }}>{a.label}</span>}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {!streaming && shots.length < 3 && <button onClick={startCamera} style={btn(C.green)}>📷 {shots.length === 0 ? 'Start Scan' : 'Resume'}</button>}
            {streaming && <button onClick={captureAngle} style={btn(C.green)}>⚡ Capture {ANGLES[angleIdx].label}</button>}
            {shots.length > 0 && <button onClick={reset} style={btn(C.surface)}>↺ Restart</button>}
          </div>

          {shots.length >= 3 && (
            <button onClick={analyse} disabled={loading} style={{ ...btn(C.green, true), opacity: loading ? 0.6 : 1 }}>
              {loading ? '🔍 Identifying species…' : '🌿 Identify Plant'}
            </button>
          )}
        </>
      )}

      {error && <div style={{ marginTop: 12, padding: 12, background: '#FDEDED', border: `1px solid #F5B5B5`, borderRadius: 10, color: C.danger, fontSize: 13 }}>{error}</div>}

      {/* Results — top 3 candidates */}
      {analysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <p style={{ fontSize: 13, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 4px' }}>Which one is it?</p>
            <p style={{ fontSize: 12, color: C.sub, margin: 0 }}>Top matches from the botanical model — tap to confirm.</p>
          </div>

          {analysis.candidates.map((c, i) => (
            <div key={i} onClick={() => setChosenIdx(i)}
              style={{ background: C.surface, border: `2px solid ${i === chosenIdx ? C.green : C.border}`, borderRadius: 12, padding: 14, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>{c.commonName}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: C.sub, fontStyle: 'italic' }}>{c.scientificName} · {c.family}</p>
                </div>
                {i === chosenIdx && <span style={{ color: C.green, fontSize: 18 }}>✓</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, background: C.greenLight, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: pct(c.score), height: '100%', background: confColor(c.score) }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: confColor(c.score) }}>{pct(c.score)}</span>
              </div>
            </div>
          ))}

          {/* uncertainty notice */}
          {analysis.candidates[0].score < 0.5 && (
            <div style={{ background: '#FFF6E5', border: `1px solid #F0C36D`, borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#8A6D1A' }}>
              ⚠️ Low confidence. For a better match, retake with clear photos of leaves and flowers, or pick the closest from above.
            </div>
          )}

          {/* care for the chosen candidate */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.8 }}>Care for {analysis.candidates[chosenIdx].commonName}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <div><span style={{ fontSize: 18 }}>💧</span><p style={{ margin: '4px 0 0', fontSize: 11, color: C.sub }}>WATERING</p><p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>{analysis.care.wateringFrequency}</p></div>
              <div><span style={{ fontSize: 18 }}>🪴</span><p style={{ margin: '4px 0 0', fontSize: 11, color: C.sub }}>POT SIZE</p><p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>{analysis.care.potSize}</p></div>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: C.sub }}>{analysis.care.wateringTips}</p>
            <div style={{ marginTop: 10 }}>
              {analysis.care.careTips.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                  <span style={{ color: C.green, fontWeight: 700 }}>{i + 1}.</span>
                  <p style={{ margin: 0, fontSize: 13, color: C.text }}>{t}</p>
                </div>
              ))}
            </div>
          </div>

          <button onClick={confirmAndSave} disabled={loading} style={{ ...btn(C.green, true), opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Saving…' : `✓ Confirm "${analysis.candidates[chosenIdx].commonName}" & Save`}
          </button>
          <button onClick={reset} style={btn(C.surface, true)}>↺ Scan Again</button>
        </div>
      )}

      {/* Saved plants */}
      {!analysis && saved.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <p style={{ fontSize: 13, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>My Plants</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {saved.map(p => (
              <div key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'center', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 10 }}>
                <img src={p.image_urls?.[0]} alt={p.plant_name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 10, flexShrink: 0, background: C.greenLight }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.text }}>{p.plant_name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: C.green }}>💧 Next watering: {p.next_watering_due ? new Date(p.next_watering_due).toLocaleDateString() : '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
