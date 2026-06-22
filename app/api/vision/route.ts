import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' });
const PLANTNET_KEY = process.env.PLANTNET_API_KEY ?? '';

// helper: base64 data-url -> Blob
function dataUrlToBlob(dataUrl: string): { blob: Blob; type: string } {
  const [header, b64] = dataUrl.split(',');
  const type = header.match(/data:(.*);/)?.[1] ?? 'image/jpeg';
  const bytes = Buffer.from(b64, 'base64');
  return { blob: new Blob([bytes], { type }), type };
}

type Candidate = {
  scientificName: string;
  commonName: string;
  genus: string;
  family: string;
  score: number; // 0-1
};

const CARE_PROMPT = (name: string, sci: string) =>
`You are a plant care expert. The plant has been identified as "${name}" (${sci}) by a specialist botanical model. Do NOT re-identify it. Provide care guidance ONLY, as a valid JSON object, no extra text:

{
  "wateringFrequency": "e.g. Every 3-4 days",
  "wateringTips": "Brief watering advice",
  "potSize": "e.g. 6-8 inch pot recommended",
  "potSizeReason": "Why",
  "careTips": ["tip 1", "tip 2", "tip 3"]
}`;

export async function POST(req: NextRequest) {
  try {
    const { images, organs } = await req.json();
    // images: string[] of data URLs (top, side, soil), organs: string[] e.g. ['leaf','leaf','auto']

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }
    if (!PLANTNET_KEY) {
      return NextResponse.json({ error: 'PlantNet API key not configured' }, { status: 500 });
    }

    // ── Layer 1: Pl@ntNet species ID (all photos at once) ──
    const form = new FormData();
    images.slice(0, 5).forEach((img: string, i: number) => {
      const { blob } = dataUrlToBlob(img);
      form.append('images', blob, `image_${i}.jpg`);
      form.append('organs', organs?.[i] ?? 'auto');
    });

    const pnRes = await fetch(
      `https://my-api.plantnet.org/v2/identify/all?api-key=${PLANTNET_KEY}&lang=en&nb-results=3`,
      { method: 'POST', body: form }
    );

    if (!pnRes.ok) {
      const txt = await pnRes.text();
      return NextResponse.json({ error: `PlantNet: ${pnRes.status} ${txt.slice(0, 120)}` }, { status: 502 });
    }

    const pn = await pnRes.json();
    const results = (pn.results ?? []).slice(0, 3);

    if (results.length === 0) {
      return NextResponse.json({ error: 'No plant match found. Try clearer photos of leaves or flowers.' }, { status: 200 });
    }

    const candidates: Candidate[] = results.map((r: Record<string, unknown>) => {
      const sp = r.species as Record<string, unknown>;
      const commonNames = (sp.commonNames as string[]) ?? [];
      return {
        scientificName: (sp.scientificNameWithoutAuthor as string) ?? 'Unknown',
        commonName: commonNames[0] ?? (sp.scientificNameWithoutAuthor as string) ?? 'Unknown',
        genus: ((sp.genus as Record<string, unknown>)?.scientificNameWithoutAuthor as string) ?? '',
        family: ((sp.family as Record<string, unknown>)?.scientificNameWithoutAuthor as string) ?? '',
        score: (r.score as number) ?? 0,
      };
    });

    const top = candidates[0];

    // ── Layer 4: Groq care advice for the top match (explanation only) ──
    let care = {
      wateringFrequency: 'Every 5-7 days',
      wateringTips: 'Water when top inch of soil is dry.',
      potSize: 'Match to root ball',
      potSizeReason: 'Allows healthy root growth.',
      careTips: ['Provide bright indirect light', 'Avoid overwatering', 'Ensure good drainage'],
    };
    try {
      const g = await groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{ role: 'user', content: CARE_PROMPT(top.commonName, top.scientificName) }],
        max_tokens: 600,
      });
      const raw = g.choices[0]?.message?.content ?? '';
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) care = { ...care, ...JSON.parse(m[0]) };
    } catch { /* keep defaults if Groq fails */ }

    return NextResponse.json({
      candidates,                 // top 3 with confidence
      topMatch: top,
      care,
      remaining: pn.remainingIdentificationRequests,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
