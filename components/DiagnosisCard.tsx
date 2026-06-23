'use client';

import { useState } from 'react';

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

const C = {
  surface: '#FFFFFF', border: '#D5E5D5', green: '#2E7D32', greenLight: '#E3F2E3',
  text: '#1A2E1A', sub: '#5A6B5A', danger: '#C0392B', warn: '#E67E22',
};

const healthColor = (h: string) =>
  h === 'healthy' ? C.green : h === 'mild stress' ? C.warn : C.danger;
const likColor = (l: string) =>
  l === 'high' ? C.danger : l === 'medium' ? C.warn : C.sub;

export function DiagnosisCard({ diagnosis }: { diagnosis: Diagnosis }) {
  const [answers, setAnswers] = useState<Record<string, 'yes' | 'no'>>({});

  // narrow: tally which causes the user's answers point toward
  const leaning: Record<string, number> = {};
  diagnosis.clarifyingQuestions.forEach(q => {
    const a = answers[q.id];
    if (a === 'yes') leaning[q.ifYes] = (leaning[q.ifYes] ?? 0) + 1;
    if (a === 'no') leaning[q.ifNo] = (leaning[q.ifNo] ?? 0) + 1;
  });
  const topLeaning = Object.entries(leaning).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* overall */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.8 }}>Health check</span>
          <span style={{ background: healthColor(diagnosis.overallHealth) + '22', color: healthColor(diagnosis.overallHealth), border: `1px solid ${healthColor(diagnosis.overallHealth)}55`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>{diagnosis.overallHealth}</span>
        </div>
        {diagnosis.observations?.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {diagnosis.observations.map((o, i) => (
              <p key={i} style={{ margin: '2px 0', fontSize: 13, color: C.text }}>👁️ {o}</p>
            ))}
          </div>
        )}
      </div>

      {/* differentials */}
      <div>
        <p style={{ fontSize: 13, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 8px' }}>Possible causes</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {diagnosis.differentials.map((d, i) => {
            const isLeaning = topLeaning && d.cause.toLowerCase().includes(topLeaning.toLowerCase());
            return (
              <div key={i} style={{ background: C.surface, border: `2px solid ${isLeaning ? C.green : C.border}`, borderRadius: 12, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                    {isLeaning && '➡️ '}Possible: {d.cause}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: likColor(d.likelihood), textTransform: 'uppercase' }}>{d.likelihood}</span>
                </div>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: C.text }}>🔍 {d.evidence}</p>
                <p style={{ margin: 0, fontSize: 12, color: C.sub }}>❓ Can't tell from photo: {d.missingEvidence}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* clarifying question flow */}
      {diagnosis.clarifyingQuestions?.length > 0 && (
        <div style={{ background: C.greenLight, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
          <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: C.text }}>Answer to narrow it down:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {diagnosis.clarifyingQuestions.map(q => (
              <div key={q.id}>
                <p style={{ margin: '0 0 6px', fontSize: 13, color: C.text }}>{q.question}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['yes', 'no'] as const).map(opt => (
                    <button key={opt} onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                      style={{ flex: 1, padding: '8px', borderRadius: 8, border: `2px solid ${answers[q.id] === opt ? C.green : C.border}`, background: answers[q.id] === opt ? C.surface : 'transparent', color: C.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {topLeaning && (
            <p style={{ margin: '12px 0 0', fontSize: 13, color: C.green, fontWeight: 600 }}>
              ➡️ Your answers point toward: {topLeaning}
            </p>
          )}
        </div>
      )}

      {/* honesty footer */}
      <p style={{ fontSize: 11, color: C.sub, textAlign: 'center', margin: 0 }}>
        This is first-pass guidance, not a diagnosis. Root and soil problems aren't visible in photos.
      </p>
    </div>
  );
}
