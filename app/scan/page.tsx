'use client';

export const dynamic = 'force-dynamic';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { computeWatering, nextWateringDate, type LightLevel } from '@/lib/careEngine';
import { DiagnosisCard, type Diagnosis } from '@/components/DiagnosisCard';

type Candidate = { scientificName: string; commonName: string; genus: string; family: string; score: number };
type Care = { wateringFrequency: string; wateringTips: string; potSize: string; potSizeReason: string; careTips: string[] };
type Analysis = { candidates: Candidate[]; topMatch: Candidate; care: Care };

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

const LIGHTS: { key: LightLevel; label: string; icon: string }[] = [
  { key: 'low', label: 'Low', icon: '🌥️' },
  { key: 'medium', label: 'Medium', icon: '⛅' },
  { key: 'bright', label: 'Bright', icon: '☀️' },
];

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [streaming, setStreaming] = useState(false);
  const [shots, setShots] = useState<string[]>([]);
  const [angleIdx, setAngleIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [chosenIdx, setChosenIdx] = useState(0);
  const [light, setLight] = useState<LightLevel | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      setUserId(data.user.id);
    });
  }, [router]);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } });
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
    const next = [...shots, c.toDataURL('image/jpeg', 0.85)];
    setShots(next);
    if (next.length >= 3) { stopCamera(); setAngleIdx(0); } else setAngleIdx(next.length);
  }, [shots, stopCamera]);
  const reset = () => { setShots([]); setAngleIdx(0); setAnalysis(null); setChosenIdx(0); setLight(null); setDiagnosis(null); setError(null); };

  const analyse = async () => {
    if (shots.length < 3) return;
    setLoading(true); setError(null);
    try {
      // Layer 1: species ID
      const res = await fetch('/api/vision', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ images: shots, organs: ANGLES.map(a => a.organ) }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data); setChosenIdx(0);

      // Layer 2: disease/stress diagnosis — separate call, runs automatically
      try {
        const dRes = await fetch('/api/diagnose', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ images: shots, speciesName: data.topMatch?.commonName }) });
        const dData = await dRes.json();
        if (!dData.error && dData.diagnosis) setDiagnosis(dData.diagnosis);
      } catch { /* diagnosis is best-effort; species ID still succeeds */ }
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Analysis failed'); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!analysis || !userId || !light) return;
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
      // care engine: light + season aware
      const engine = computeWatering({ baseWateringFrequency: care.wateringFrequency, light, lat: null });
      const due = nextWateringDate(new Date().toISOString().slice(0, 10), engine.intervalDays);

      await supabase.from('plants').insert({
        user_id: userId,
        plant_name: chosen.commonName, scientific_name: chosen.scientificName,
        confidence: pct(chosen.score), light_level: light,
        plant_health: diagnosis?.overallHealth ?? null,
        plant_health_details: diagnosis?.observations?.join('; ') ?? null,
        watering_frequency: `Every ${engine.intervalDays} days`, watering_tips: care.wateringTips,
        pot_size: care.potSize, pot_size_reason: care.potSizeReason,
        care_tips: care.careTips, image_urls: urls,
        last_watered: new Date().toISOString().slice(0, 10),
        next_watering_due: due,
      });
      router.push('/');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setLoading(false); }
  };

  const btn = (bg: string, full?: boolean): React.CSSProperties => ({
    background: bg, color: bg === C.surface ? C.green : '#fff',
    border: bg === C.surface ? `1px solid ${C.border}` : 'none', borderRadius: 10,
    padding: full ? 14 : '10px 16px', fontSize: full ? 15 : 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0, width: full ? '100%' : undefined,
  });

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 80px', minHeight: '100vh', background: C.bg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: C.text }}>←</button>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>Scan a Plant</h1>
      </div>

      {!analysis && (
        <>
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#000', aspectRatio: '4/3', marginBottom: 12, border: `1px solid ${C.border}` }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: streaming ? 'block' : 'none' }} />
            {!streaming && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 8, background: C.greenLight }}><span style={{ fontSize: 48 }}>🌱</span><span style={{ color: C.sub, fontSize: 13 }}>3 angles → best identification</span></div>}
            {streaming && <div style={{ position: 'absolute', top: 12, left: 12, right: 12, background: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: '8px 12px' }}><p style={{ margin: 0, color: '#fff', fontSize: 13, fontWeight: 600 }}>📸 {ANGLES[angleIdx].label} ({shots.length + 1}/3)</p><p style={{ margin: '2px 0 0', color: '#cfe', fontSize: 12 }}>{ANGLES[angleIdx].hint}</p></div>}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
          {shots.length > 0 && <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>{ANGLES.map((a, i) => <div key={a.key} style={{ flex: 1, aspectRatio: '1', borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden', background: C.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{shots[i] ? <img src={shots[i]} alt={a.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 11, color: C.sub, textAlign: 'center', padding: 4 }}>{a.label}</span>}</div>)}</div>}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {!streaming && shots.length < 3 && <button onClick={startCamera} style={btn(C.green)}>📷 {shots.length === 0 ? 'Start Scan' : 'Resume'}</button>}
            {streaming && <button onClick={captureAngle} style={btn(C.green)}>⚡ Capture {ANGLES[angleIdx].label}</button>}
            {shots.length > 0 && <button onClick={reset} style={btn(C.surface)}>↺ Restart</button>}
          </div>
          {shots.length >= 3 && <button onClick={analyse} disabled={loading} style={{ ...btn(C.green, true), opacity: loading ? 0.6 : 1 }}>{loading ? '🔍 Identifying…' : '🌿 Identify Plant'}</button>}
        </>
      )}

      {error && <div style={{ marginTop: 12, padding: 12, background: '#FDEDED', border: `1px solid #F5B5B5`, borderRadius: 10, color: C.danger, fontSize: 13 }}>{error}</div>}

      {analysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.8, margin: 0 }}>Which one is it?</p>
          {analysis.candidates.map((c, i) => (
            <div key={i} onClick={() => setChosenIdx(i)} style={{ background: C.surface, border: `2px solid ${i === chosenIdx ? C.green : C.border}`, borderRadius: 12, padding: 14, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div><p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>{c.commonName}</p><p style={{ margin: '2px 0 0', fontSize: 12, color: C.sub, fontStyle: 'italic' }}>{c.scientificName}</p></div>
                {i === chosenIdx && <span style={{ color: C.green, fontSize: 18 }}>✓</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, background: C.greenLight, borderRadius: 3, overflow: 'hidden' }}><div style={{ width: pct(c.score), height: '100%', background: confColor(c.score) }} /></div>
                <span style={{ fontSize: 12, fontWeight: 600, color: confColor(c.score) }}>{pct(c.score)}</span>
              </div>
            </div>
          ))}

          {/* Health diagnosis — runs automatically */}
          {diagnosis && <DiagnosisCard diagnosis={diagnosis} />}

          {/* Light level — the one context question */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: C.text }}>How much light does it get?</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {LIGHTS.map(l => (
                <button key={l.key} onClick={() => setLight(l.key)} style={{ flex: 1, padding: '10px 4px', borderRadius: 10, border: `2px solid ${light === l.key ? C.green : C.border}`, background: light === l.key ? C.greenLight : C.surface, cursor: 'pointer' }}>
                  <div style={{ fontSize: 22 }}>{l.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginTop: 2 }}>{l.label}</div>
                </button>
              ))}
            </div>
          </div>

          <button onClick={save} disabled={loading || !light} style={{ ...btn(C.green, true), opacity: loading || !light ? 0.5 : 1 }}>
            {loading ? 'Saving…' : !light ? 'Select light level first' : `✓ Save "${analysis.candidates[chosenIdx].commonName}"`}
          </button>
          <button onClick={reset} style={btn(C.surface, true)}>↺ Scan Again</button>
        </div>
      )}
    </main>
  );
}
