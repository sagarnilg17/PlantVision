import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' });

// Symptom-only prompt. Explicitly forbids species ID and single verdicts.
const DIAG_PROMPT = `You are a plant pathology assistant. You are NOT identifying the species — that is already known. Examine ONLY visible stress and disease symptoms (leaf colour, spots, wilting, pests, soil surface, stem condition).

Return ONLY valid JSON, no extra text, in this exact shape:

{
  "overallHealth": "healthy | mild stress | needs attention | urgent",
  "observations": ["short visual fact you actually see", "..."],
  "differentials": [
    {
      "cause": "e.g. Overwatering",
      "likelihood": "high | medium | low",
      "evidence": "what in the image suggests this",
      "missingEvidence": "what you cannot tell from a photo alone"
    }
  ],
  "clarifyingQuestions": [
    { "id": "q1", "question": "Yes/No question that would narrow the diagnosis", "ifYes": "cause this points to", "ifNo": "cause this points to" }
  ]
}

Rules:
- Give 2-3 differentials ranked by likelihood. NEVER give a single confident verdict.
- Use hedged language ("possible", "consistent with").
- Always populate missingEvidence — be honest about photo limitations (roots, soil moisture, smell are invisible).
- Give 2-3 clarifyingQuestions that a non-expert can answer.`;

export async function POST(req: NextRequest) {
  try {
    const { images, speciesName } = await req.json();
    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    const content: Array<Record<string, unknown>> = images.slice(0, 3).map((img: string) => {
      const [header, b64] = img.split(',');
      const mediaType = header.match(/data:(.*);/)?.[1] ?? 'image/jpeg';
      return { type: 'image_url', image_url: { url: `data:${mediaType};base64,${b64}` } };
    });
    content.push({
      type: 'text',
      text: `${DIAG_PROMPT}\n\nKnown species: ${speciesName ?? 'unknown'}. Focus on health symptoms only.`,
    });

    const response = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{ role: 'user', content: content as never }],
      max_tokens: 900,
    });

    const raw = response.choices[0]?.message?.content ?? '';
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Could not parse diagnosis');
    const diagnosis = JSON.parse(m[0]);

    return NextResponse.json({ diagnosis });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
