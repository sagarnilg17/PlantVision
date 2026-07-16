'use client';

import { useState } from 'react';
import { Search, Check, X } from 'lucide-react';
import { T } from '@/lib/theme';

export type Differential = {
  cause: string;
  likelihood: 'high' | 'medium' | 'low';
  evidence: string;
  missingEvidence: string;
};
export type ClarifyingQ = { id: string; question: string; ifYes: string; ifNo: string };
export type Diagnosis = {
  overallHealth: string;
  observations: string[];
  differentials: Differential[];
  clarifyingQuestions: ClarifyingQ[];
};

type AnswerVal = 'yes' | 'partly' | 'no';

const healthMeta = (h: string) =>
  h === 'healthy'
    ? { color: T.green,   bg: T.greenLight,  border: T.greenMid,   label: 'Healthy' }
    : h === 'mild stress'
    ? { color: T.warn,    bg: T.warnLight,   border: T.amberBorder, label: 'Mild stress' }
    : { color: T.danger,  bg: T.dangerLight, border: T.dangerBorder, label: 'Needs attention' };

const likMeta = (l: string) =>
  l === 'high'   ? { color: T.danger, label: 'High' }
  : l === 'medium' ? { color: T.warn,   label: 'Med' }
  : { color: T.muted, label: 'Low' };

export function DiagnosisCard({ diagnosis }: { diagnosis: Diagnosis }) {
  const [answers, setAnswers] = useState<Record<string, AnswerVal>>({});

  const leaning: Record<string, number> = {};
  diagnosis.clarifyingQuestions.forEach(q => {
    const a = answers[q.id];
    if (a === 'yes')    { leaning[q.ifYes] = (leaning[q.ifYes] ?? 0) + 1; }
    if (a === 'no')     { leaning[q.ifNo]  = (leaning[q.ifNo]  ?? 0) + 1; }
    if (a === 'partly') {
      leaning[q.ifYes] = (leaning[q.ifYes] ?? 0) + 0.5;
      leaning[q.ifNo]  = (leaning[q.ifNo]  ?? 0) + 0.5;
    }
  });
  const topLeaning = Object.entries(leaning).sort((a, b) => b[1] - a[1])[0]?.[0];
  const answered   = Object.keys(answers).length;
  const total      = diagnosis.clarifyingQuestions?.length ?? 0;

  const hm = healthMeta(diagnosis.overallHealth);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Overall health */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r, padding: 16, boxShadow: T.shadow }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: diagnosis.observations?.length ? 12 : 0 }}>
          <span style={{ fontSize: 13, color: T.sub, fontWeight: 700 }}>Health check</span>
          <span style={{
            background: hm.bg, color: hm.color, border: `1px solid ${hm.border}`,
            borderRadius: T.rPill, padding: '3px 12px', fontSize: 11, fontWeight: 700,
            textTransform: 'capitalize',
          }}>
            {hm.label}
          </span>
        </div>
        {diagnosis.observations?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {diagnosis.observations.map((o, i) => (
              <p key={i} style={{ margin: 0, fontSize: 13, color: T.text, lineHeight: 1.5 }}>• {o}</p>
            ))}
          </div>
        )}
      </div>

      {/* Differentials */}
      {diagnosis.differentials.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 13, color: T.sub, margin: 0, fontWeight: 700 }}>Possible causes</p>
          {diagnosis.differentials.map((d, i) => {
            const isLeaning = !!(topLeaning && d.cause.toLowerCase().includes(topLeaning.toLowerCase()));
            const lm = likMeta(d.likelihood);
            return (
              <div key={i} style={{
                background: isLeaning ? T.greenLight : T.surface,
                border: `2px solid ${isLeaning ? T.green : T.border}`,
                borderRadius: T.r, padding: 14, boxShadow: T.shadow,
                transition: 'border-color 0.2s, background 0.2s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text, flex: 1, paddingRight: 8 }}>
                    {isLeaning && '→ '}Possible: {d.cause}
                  </p>
                  <span style={{ fontSize: 11, fontWeight: 700, color: lm.color, flexShrink: 0, marginTop: 2 }}>{lm.label}</span>
                </div>
                <p style={{ margin: '0 0 6px', fontSize: 13, color: T.text, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <Search size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" /> {d.evidence}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: T.muted }}>Can't tell from photo: {d.missingEvidence}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Clarifying questions */}
      {total > 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r, padding: 16, boxShadow: T.shadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>Narrow it down</p>
            <span style={{ fontSize: 11, color: T.muted }}>{answered}/{total} answered</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {diagnosis.clarifyingQuestions.map((q, qi) => {
              const ans = answers[q.id];
              return (
                <div key={q.id}>
                  <p style={{ margin: '0 0 8px', fontSize: 13, color: T.text, lineHeight: 1.55, fontWeight: ans ? 600 : 400 }}>
                    {qi + 1}. {q.question}
                  </p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {/* Yes */}
                    <button onClick={() => setAnswers(a => ({ ...a, [q.id]: 'yes' }))} aria-pressed={ans === 'yes'} style={{
                      flex: 1, padding: '9px 0', borderRadius: T.rSm, cursor: 'pointer',
                      border: `2px solid ${ans === 'yes' ? T.green : T.border}`,
                      background: ans === 'yes' ? T.greenLight : 'transparent',
                      color: ans === 'yes' ? T.green : T.sub,
                      fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}>
                      {ans === 'yes' && <Check size={13} strokeWidth={2.6} aria-hidden="true" />}Yes
                    </button>
                    {/* Partly */}
                    <button onClick={() => setAnswers(a => ({ ...a, [q.id]: 'partly' }))} aria-pressed={ans === 'partly'} style={{
                      flex: 1, padding: '9px 0', borderRadius: T.rSm, cursor: 'pointer',
                      border: `2px solid ${ans === 'partly' ? T.warn : T.border}`,
                      background: ans === 'partly' ? T.warnLight : 'transparent',
                      color: ans === 'partly' ? T.warn : T.sub,
                      fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}>
                      {ans === 'partly' && <Check size={13} strokeWidth={2.6} aria-hidden="true" />}Partly
                    </button>
                    {/* No */}
                    <button onClick={() => setAnswers(a => ({ ...a, [q.id]: 'no' }))} aria-pressed={ans === 'no'} style={{
                      flex: 1, padding: '9px 0', borderRadius: T.rSm, cursor: 'pointer',
                      border: `2px solid ${ans === 'no' ? T.borderMid : T.border}`,
                      background: ans === 'no' ? T.bg : 'transparent',
                      color: ans === 'no' ? T.text : T.sub,
                      fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}>
                      {ans === 'no' && <X size={13} strokeWidth={2.6} aria-hidden="true" />}No
                    </button>
                  </div>
                  {ans === 'yes' && (
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: T.green }}>→ suggests {q.ifYes}</p>
                  )}
                  {ans === 'partly' && (
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: T.warn }}>→ partially consistent with {q.ifYes}</p>
                  )}
                  {ans === 'no' && (
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: T.sub }}>→ less likely: {q.ifNo}</p>
                  )}
                </div>
              );
            })}
          </div>

          {topLeaning && answered > 0 && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.greenMid}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.green, flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 13, color: T.green, fontWeight: 700 }}>
                Most likely: {topLeaning}
              </p>
            </div>
          )}
        </div>
      )}

      <p style={{ fontSize: 11, color: T.muted, textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
        First-pass guidance only · Root and soil problems aren't visible in photos
      </p>
    </div>
  );
}
