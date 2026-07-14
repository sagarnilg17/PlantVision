import { NextRequest, NextResponse } from 'next/server';
import { Type } from '@google/genai';
import { getServerUser } from '@/lib/supabaseServer';
import { getGemini, GEMINI_MODEL } from '@/lib/gemini';

const MAX_TOTAL_CHARS = 20_000_000; // ~15 MB of base64 image data

// Species name is known at this point (from PlantNet via /api/vision).
// This route examines ONLY visible stress and disease symptoms.
const DIAG_PROMPT = `You are a plant pathology assistant. The species is already identified — do NOT re-identify it. Examine ONLY visible stress and disease symptoms: leaf colour, spots, wilting, pests, soil surface, stem condition.

Rules:
- overallHealth is one of: "healthy", "mild stress", "needs attention", "urgent".
- Give 2-3 differentials ranked by likelihood ("high" | "medium" | "low"). NEVER give a single confident verdict.
- Use hedged language ("possible", "consistent with").
- Always populate missingEvidence — roots, soil moisture, and smell are invisible in photos.
- Give 2-3 clarifyingQuestions a non-expert can answer (id like "q1").`;

const DIAG_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    overallHealth: { type: Type.STRING },
    observations:  { type: Type.ARRAY, items: { type: Type.STRING } },
    differentials: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          cause:           { type: Type.STRING },
          likelihood:      { type: Type.STRING },
          evidence:        { type: Type.STRING },
          missingEvidence: { type: Type.STRING },
        },
        required: ['cause', 'likelihood', 'evidence', 'missingEvidence'],
        propertyOrdering: ['cause', 'likelihood', 'evidence', 'missingEvidence'],
      },
    },
    clarifyingQuestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id:       { type: Type.STRING },
          question: { type: Type.STRING },
          ifYes:    { type: Type.STRING },
          ifNo:     { type: Type.STRING },
        },
        required: ['id', 'question', 'ifYes', 'ifNo'],
        propertyOrdering: ['id', 'question', 'ifYes', 'ifNo'],
      },
    },
  },
  required: ['overallHealth', 'observations', 'differentials', 'clarifyingQuestions'],
  propertyOrdering: ['overallHealth', 'observations', 'differentials', 'clarifyingQuestions'],
};

export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { images, speciesName } = await req.json();
    if (!Array.isArray(images) || images.length === 0 || !images.every(i => typeof i === 'string')) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }
    if (images.reduce((n: number, s: string) => n + s.length, 0) > MAX_TOTAL_CHARS) {
      return NextResponse.json({ error: 'Images too large' }, { status: 413 });
    }

    const ai = getGemini();
    if (!ai) return NextResponse.json({ error: 'AI is not configured (GEMINI_API_KEY missing)' }, { status: 500 });

    // Images as inline data, then the diagnosis prompt with species context.
    const parts: Array<Record<string, unknown>> = images.slice(0, 3).map((img: string) => {
      const [header, b64] = img.split(',');
      const mimeType = header.match(/data:(.*);/)?.[1] ?? 'image/jpeg';
      return { inlineData: { mimeType, data: b64 } };
    });
    parts.push({ text: `${DIAG_PROMPT}\n\nIdentified species: ${speciesName ?? 'unknown'}. Focus on health symptoms only.` });

    const res = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts }],
      config: { responseMimeType: 'application/json', responseSchema: DIAG_SCHEMA },
    });

    const diagnosis = JSON.parse(res.text ?? '{}');
    return NextResponse.json({ diagnosis });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
