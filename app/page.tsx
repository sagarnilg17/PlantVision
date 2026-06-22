'use client';

import { useRef, useState, useCallback } from 'react';

type Result = {
  result: string;
  usage?: { input_tokens: number; output_tokens: number };
  model?: string;
  error?: string;
};

type AnalysisEntry = {
  id: string;
  imageUrl: string;
  prompt: string;
  result: string;
  tokens: number;
  model: string;
  ts: string;
};

export default function VisionPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [streaming, setStreaming] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('Describe what you see in detail.');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<AnalysisEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
        setCaptured(null);
      }
    } catch {
      setError('Camera permission denied or not available.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
  }, []);

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    const dataUrl = c.toDataURL('image/jpeg', 0.85);
    setCaptured(dataUrl);
    stopCamera();
  }, [stopCamera]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCaptured(reader.result as string);
    reader.readAsDataURL(file);
  };

  const analyse = async () => {
    if (!captured) return;
    setLoading(true);
    setError(null);
    const [header, b64] = captured.split(',');
    const mediaType = header.match(/data:(.*);/)?.[1] ?? 'image/jpeg';
    try {
      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: b64, mediaType, prompt }),
      });
      const data: Result = await res.json();
      if (data.error) throw new Error(data.error);
      setHistory((prev) => [
        {
          id: Date.now().toString(),
          imageUrl: captured,
          prompt,
          result: data.result,
          tokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
          model: data.model ?? 'gemini',
          ts: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const totalTokens = history.reduce((s, h) => s + h.tokens, 0);

  const btn = (bg: string): React.CSSProperties => ({
    background: bg, color: '#F5F5F5', border: 'none', borderRadius: 10,
    padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', flexShrink: 0,
  });

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 80px', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F5F5F5', margin: 0 }}>Vision Lab</h1>
        <p style={{ fontSize: 13, color: '#9E9E9E', margin: '4px 0 0' }}>
          Gemini · {history.length} runs
        </p>
      </div>

      <div style={{
        position: 'relative', borderRadius: 16, overflow: 'hidden',
        background: '#1A1A1A', aspectRatio: '4/3', marginBottom: 16,
        border: '1px solid #2A2A2A',
      }}>
        <video ref={videoRef} autoPlay playsInline muted
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: streaming ? 'block' : 'none' }} />
        {captured && !streaming && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={captured} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        {!streaming && !captured && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 40 }}>📷</span>
            <span style={{ color: '#9E9E9E', fontSize: 13 }}>Take a photo or upload</span>
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {!streaming ? (
          <button onClick={startCamera} style={btn('#6C63FF')}>📷 Camera</button>
        ) : (
          <>
            <button onClick={capture} style={btn('#6C63FF')}>⚡ Capture</button>
            <button onClick={stopCamera} style={btn('#2A2A2A')}>✕ Cancel</button>
          </>
        )}
        <button onClick={() => fileRef.current?.click()} style={btn('#2A2A2A')}>📁 Upload</button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFileChange} style={{ display: 'none' }} />
      </div>

      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2}
        placeholder="What should Gemini look for?"
        style={{
          width: '100%', boxSizing: 'border-box', background: '#1A1A1A',
          border: '1px solid #2A2A2A', borderRadius: 12, padding: '10px 14px',
          color: '#F5F5F5', fontSize: 14, resize: 'none', outline: 'none',
          marginBottom: 12, fontFamily: 'inherit',
        }} />

      <button onClick={analyse} disabled={!captured || loading}
        style={{ ...btn('#6C63FF'), width: '100%', fontSize: 15, padding: '14px', opacity: !captured || loading ? 0.5 : 1, cursor: !captured || loading ? 'not-allowed' : 'pointer' }}>
        {loading ? '⏳ Analysing…' : '🔍 Analyse with Gemini'}
      </button>

      {error && (
        <div style={{ marginTop: 12, padding: 12, background: '#2a1515', border: '1px solid #FF4D4D', borderRadius: 10, color: '#FF4D4D', fontSize: 13 }}>
          {error}
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Results
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {history.map((h) => (
              <div key={h.id} style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 12, padding: '12px 14px', borderBottom: '1px solid #2A2A2A', alignItems: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={h.imageUrl} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#9E9E9E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.prompt}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#555' }}>{h.ts} · {h.tokens} tokens · {h.model}</p>
                  </div>
                </div>
                <p style={{ margin: 0, padding: '12px 14px', fontSize: 14, lineHeight: 1.6, color: '#F5F5F5' }}>{h.result}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
