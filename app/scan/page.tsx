'use client';

export const dynamic = 'force-dynamic';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { computeWatering, nextWateringDate, type LightLevel } from '@/lib/careEngine';
import { DiagnosisCard, type Diagnosis } from '@/components/DiagnosisCard';
import { Nav } from '@/components/Nav';
import { T } from '@/lib/theme';

type Candidate = { scientificName: string; commonName: string; genus: string; family: string; score: number };
type Care = { wateringFrequency: string; wateringTips: string; potSize: string; potSizeReason: string; careTips: string[]; toxicToAnimals?: boolean; toxicToHumans?: boolean; toxicityNotes?: string };
type Analysis = { candidates: Candidate[]; topMatch: Candidate; care: Care };

const ANGLES = [
  { key: 'top',  label: 'Top view',  hint: 'Shoot straight down — show the leaves', organ: 'leaf' },
  { key: 'side', label: 'Side view', hint: 'Full plant from the side',               organ: 'leaf' },
  { key: 'soil', label: 'Soil & base', hint: 'Close to the stem base and soil',      organ: 'bark' },
];

const LIGHTS: { key: LightLevel; label: string; sub: string }[] = [
  { key: 'low',    label: 'Low',    sub: 'Shade / north window' },
  { key: 'medium', label: 'Medium', sub: 'Indirect / east window' },
  { key: 'bright', label: 'Bright', sub: 'Direct / south window' },
];

const confColor = (s: number) => s >= 0.5 ? T.green : s >= 0.2 ? T.warn : T.danger;
const pct       = (s: number) => `${Math.round(s * 100)}%`;

function Spinner() {
  return <div style={{ width: 24, height: 24, border: `2.5px solid ${T.greenLight}`, borderTop: `2.5px solid ${T.green}`, borderRadius: '50%', animation: 'spin 0.75s linear infinite', flexShrink: 0 }} />;
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function ScanPage() {
  const router  = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [streaming, setStreaming] = useState(false);
  const [shots,     setShots]     = useState<string[]>([]);
  const [angleIdx,  setAngleIdx]  = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [analysis,  setAnalysis]  = useState<Analysis | null>(null);
  const [chosenIdx, setChosenIdx] = useState(0);
  const [light,     setLight]     = useState<LightLevel | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [error,     setError]     = useState<string | null>(null);

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

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 3 - shots.length);
    if (files.length === 0) return;
    setError(null);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 1280;
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = img.width * scale; c.height = img.height * scale;
          c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
          setShots(prev => {
            const next = [...prev, c.toDataURL('image/jpeg', 0.85)].slice(0, 3);
            setAngleIdx(Math.min(next.length, 2));
            return next;
          });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const reset = () => {
    setShots([]); setAngleIdx(0); setAnalysis(null);
    setChosenIdx(0); setLight(null); setDiagnosis(null); setError(null);
  };

  const analyse = async () => {
    if (shots.length < 3) return;
    setLoading(true); setError(null);
    try {
      const res  = await fetch('/api/vision', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ images: shots, organs: ANGLES.map(a => a.organ) }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data); setChosenIdx(0);
      try {
        const dRes  = await fetch('/api/diagnose', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ images: shots, speciesName: data.topMatch?.commonName }) });
        const dData = await dRes.json();
        if (!dData.error && dData.diagnosis) setDiagnosis(dData.diagnosis);
      } catch { /* diagnosis is best-effort */ }
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Analysis failed'); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!analysis || !userId || !light) return;
    setLoading(true);
    try {
      const chosen = analysis.candidates[chosenIdx];
      const care   = analysis.care;

      // Upload plant photos
      const urls: string[] = [];
      for (let i = 0; i < shots.length; i++) {
        const blob = await (await fetch(shots[i])).blob();
        const path = `${userId}/${Date.now()}_${ANGLES[i].key}.jpg`;
        const { error: upErr } = await supabase.storage.from('plant-photos').upload(path, blob);
        if (!upErr) urls.push(supabase.storage.from('plant-photos').getPublicUrl(path).data.publicUrl);
      }

      // Generate botanical illustration (best-effort — plant still saves if this fails)
      let illustrationUrl: string | null = null;
      try {
        const illRes  = await fetch('/api/illustrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ speciesName: chosen.commonName }) });
        const illData = await illRes.json();
        if (illData.url) {
          // Download the generated image and re-upload to Supabase for permanent storage
          const illBlob = await (await fetch(illData.url)).blob();
          const illPath = `${userId}/illustrations/${Date.now()}_${chosen.commonName.replace(/\s+/g, '_')}.png`;
          const { error: illUpErr } = await supabase.storage.from('plant-photos').upload(illPath, illBlob, { contentType: 'image/png' });
          if (!illUpErr) illustrationUrl = supabase.storage.from('plant-photos').getPublicUrl(illPath).data.publicUrl;
        }
      } catch { /* illustration is best-effort */ }

      const engine = computeWatering({ baseWateringFrequency: care.wateringFrequency, light, lat: null });
      const due    = nextWateringDate(new Date().toISOString().slice(0, 10), engine.intervalDays);
      const { data: inserted } = await supabase.from('plants').insert({
        user_id: userId,
        plant_name: chosen.commonName, scientific_name: chosen.scientificName,
        confidence: pct(chosen.score), light_level: light,
        plant_health: diagnosis?.overallHealth ?? null,
        plant_health_details: diagnosis?.observations?.join('; ') ?? null,
        watering_frequency: `Every ${engine.intervalDays} days`, watering_tips: care.wateringTips,
        pot_size: care.potSize, pot_size_reason: care.potSizeReason,
        care_tips: care.careTips, image_urls: urls,
        illustration_url: illustrationUrl,
        last_watered: new Date().toISOString().slice(0, 10),
        next_watering_due: due,
      }).select('id').single();

      // Toxicity — best-effort update (requires: ALTER TABLE plants ADD COLUMN IF NOT EXISTS toxicity_info text;)
      if (inserted?.id && care.toxicityNotes) {
        const toxInfo = JSON.stringify({ animals: care.toxicToAnimals ?? false, humans: care.toxicToHumans ?? false, notes: care.toxicityNotes });
        await supabase.from('plants').update({ toxicity_info: toxInfo }).eq('id', inserted.id);
      }

      router.push('/');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setLoading(false); }
  };

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: T.bg, paddingBottom: 88 }}>

      {/* Header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '48px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/')}
          style={{ width: 36, height: 36, borderRadius: '50%', background: T.bg, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, color: T.text, flexShrink: 0 }}>
          ←
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>Scan a Plant</h1>
      </div>

      <div style={{ padding: '16px 16px 0' }}>

        {/* ── Capture phase ── */}
        {!analysis && (
          <>
            {/* Viewfinder */}
            <div style={{ position: 'relative', borderRadius: T.r, overflow: 'hidden', background: '#0D1A0D', aspectRatio: '4/3', marginBottom: 14, border: `1px solid ${T.border}` }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: streaming ? 'block' : 'none' }} />

              {!streaming && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, background: T.greenLight }}>
                  <span style={{ fontSize: 36 }}>📷</span>
                  <span style={{ color: T.sub, fontSize: 13, fontWeight: 500 }}>3 angles · best identification</span>
                </div>
              )}

              {/* Angle overlay */}
              {streaming && (
                <div style={{ position: 'absolute', top: 12, left: 12, right: 12, background: 'rgba(10,26,10,0.72)', borderRadius: T.rSm, padding: '10px 14px', backdropFilter: 'blur(4px)' }}>
                  <p style={{ margin: 0, color: '#fff', fontSize: 14, fontWeight: 600 }}>
                    {ANGLES[angleIdx].label} &nbsp;<span style={{ color: T.greenMid, fontSize: 12, fontWeight: 400 }}>({shots.length + 1}/3)</span>
                  </p>
                  <p style={{ margin: '3px 0 0', color: 'rgba(200,230,200,0.85)', fontSize: 12 }}>{ANGLES[angleIdx].hint}</p>
                </div>
              )}

              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {/* Angle thumbnails */}
            {shots.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {ANGLES.map((a, i) => (
                  <div key={a.key} style={{
                    flex: 1, aspectRatio: '1', borderRadius: T.rSm, overflow: 'hidden',
                    border: `1.5px solid ${shots[i] ? T.green : T.border}`,
                    background: T.greenLight, position: 'relative',
                  }}>
                    {shots[i]
                      ? <img src={shots[i]} alt={a.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <span style={{ fontSize: 11, color: T.muted, textAlign: 'center', padding: '0 4px' }}>{a.label}</span>
                        </div>
                    }
                    {shots[i] && (
                      <div style={{ position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, background: T.green, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <CheckIcon />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {!streaming && shots.length < 3 && (
                <button onClick={startCamera}
                  style={{ flex: 2, padding: '12px 0', background: T.green, color: '#fff', border: 'none', borderRadius: T.rSm, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  {shots.length === 0 ? 'Open Camera' : 'Resume'}
                </button>
              )}
              {streaming && (
                <button onClick={captureAngle}
                  style={{ flex: 2, padding: '12px 0', background: T.green, color: '#fff', border: 'none', borderRadius: T.rSm, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Capture
                </button>
              )}
              {!streaming && shots.length < 3 && (
                <button onClick={() => fileRef.current?.click()}
                  style={{ flex: 1, padding: '12px 0', background: T.surface, color: T.text, border: `1px solid ${T.border}`, borderRadius: T.rSm, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  Upload
                </button>
              )}
              {shots.length > 0 && (
                <button onClick={reset}
                  style={{ flex: 1, padding: '12px 0', background: T.surface, color: T.sub, border: `1px solid ${T.border}`, borderRadius: T.rSm, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  Reset
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFiles} style={{ display: 'none' }} />
            </div>

            {shots.length >= 3 && (
              <button onClick={analyse} disabled={loading}
                style={{ width: '100%', padding: 15, background: loading ? T.greenMid : T.green, color: '#fff', border: 'none', borderRadius: T.rSm, fontSize: 15, fontWeight: 600, cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                {loading ? <><Spinner /> Identifying…</> : 'Identify Plant'}
              </button>
            )}
          </>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{ marginTop: 12, padding: '12px 14px', background: T.dangerLight, border: `1px solid ${T.dangerBorder}`, borderRadius: T.rSm, color: T.danger, fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* ── Results phase ── */}
        {analysis && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeUp 0.3s ease' }}>
            <p style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, margin: 0, fontWeight: 700 }}>Which one is it?</p>

            {/* Candidates */}
            {analysis.candidates.map((c, i) => (
              <div key={i} onClick={() => setChosenIdx(i)}
                style={{
                  background: T.surface, border: `2px solid ${i === chosenIdx ? T.green : T.border}`,
                  borderRadius: T.r, padding: '14px 16px', cursor: 'pointer',
                  boxShadow: i === chosenIdx ? `0 0 0 1px ${T.green}22, ${T.shadow}` : T.shadow,
                  transition: 'border-color 0.15s',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>{c.commonName}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: T.muted, fontStyle: 'italic' }}>{c.scientificName}</p>
                  </div>
                  {i === chosenIdx && (
                    <div style={{ width: 22, height: 22, background: T.green, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                      <CheckIcon />
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 5, background: T.greenLight, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: pct(c.score), height: '100%', background: confColor(c.score), borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: confColor(c.score), minWidth: 36, textAlign: 'right' }}>{pct(c.score)}</span>
                </div>
              </div>
            ))}

            {/* Diagnosis */}
            {diagnosis && <DiagnosisCard diagnosis={diagnosis} />}

            {/* Light level */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r, padding: 16, boxShadow: T.shadow }}>
              <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: T.text }}>Where does it live?</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {LIGHTS.map(l => (
                  <button key={l.key} onClick={() => setLight(l.key)}
                    style={{
                      flex: 1, padding: '10px 6px 12px', borderRadius: T.rSm, textAlign: 'center',
                      border: `2px solid ${light === l.key ? T.green : T.border}`,
                      background: light === l.key ? T.greenLight : T.surface,
                      cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
                    }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>
                      {l.key === 'low' ? '🌥️' : l.key === 'medium' ? '⛅' : '☀️'}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{l.label}</div>
                    <div style={{ fontSize: 10, color: T.muted, marginTop: 2, lineHeight: 1.3 }}>{l.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Save */}
            <button onClick={save} disabled={loading || !light}
              style={{
                width: '100%', padding: 15, border: 'none', borderRadius: T.rSm,
                background: loading || !light ? T.greenLight : T.green,
                color: loading || !light ? T.muted : '#fff',
                fontSize: 15, fontWeight: 600, cursor: loading || !light ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'background 0.2s, color 0.2s',
              }}>
              {loading
                ? <><Spinner /> Saving &amp; generating illustration…</>
                : !light
                ? 'Select light level to continue'
                : `Save "${analysis.candidates[chosenIdx].commonName}"`}
            </button>

            <button onClick={reset}
              style={{ width: '100%', padding: 14, background: T.surface, color: T.sub, border: `1px solid ${T.border}`, borderRadius: T.rSm, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
              Scan again
            </button>
          </div>
        )}
      </div>

      <Nav />
    </main>
  );
}
