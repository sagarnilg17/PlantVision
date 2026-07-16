import { NextRequest, NextResponse } from 'next/server';
import { Type } from '@google/genai';
import { getServerUser } from '@/lib/supabaseServer';
import { getGemini, GEMINI_MODEL } from '@/lib/gemini';
import { getCachedCare, setCachedCare } from '@/lib/speciesCache';

const MAX_TOTAL_CHARS = 20_000_000;

const CARE_PROMPT = `You are a houseplant care expert. Give concise, practical care info for the plant below. Use "Every X days" or "Every X-Y days" for wateringFrequency. Provide exactly 3 short careTips. toxicityNotes: one sentence naming which animals/people it is toxic to and the effect, or "Non-toxic to pets and humans."`;

const CARE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    wateringFrequency: { type: Type.STRING },
    wateringTips:      { type: Type.STRING },
    potSize:           { type: Type.STRING },
    potSizeReason:     { type: Type.STRING },
    careTips:          { type: Type.ARRAY, items: { type: Type.STRING } },
    toxicToAnimals:    { type: Type.BOOLEAN },
    toxicToHumans:     { type: Type.BOOLEAN },
    toxicityNotes:     { type: Type.STRING },
  },
  required: ['wateringFrequency', 'wateringTips', 'potSize', 'potSizeReason', 'careTips', 'toxicToAnimals', 'toxicToHumans', 'toxicityNotes'],
  propertyOrdering: ['wateringFrequency', 'wateringTips', 'potSize', 'potSizeReason', 'careTips', 'toxicToAnimals', 'toxicToHumans', 'toxicityNotes'],
};

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
    const { images, organs } = await req.json();
    if (!Array.isArray(images) || images.length === 0 || !images.every(i => typeof i === 'string')) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }
    if (images.reduce((n: number, s: string) => n + s.length, 0) > MAX_TOTAL_CHARS) {
      return NextResponse.json({ error: 'Images too large' }, { status: 413 });
    }

    // 1. Build multipart body for PlantNet
    const boundary = `PlantNetBoundary${Date.now().toString(16)}`;
    const parts: Buffer[] = [];

    images.slice(0, 3).forEach((img: string, i: number) => {
      const [header, b64] = img.split(',');
      const mediaType = header.match(/data:(.*);/)?.[1] ?? 'image/jpeg';
      const ext = mediaType === 'image/png' ? 'png' : 'jpg';
      const imageBuffer = Buffer.from(b64, 'base64');

      parts.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="images"; filename="image${i}.${ext}"\r\nContent-Type: ${mediaType}\r\n\r\n`
      ));
      parts.push(imageBuffer);
      parts.push(Buffer.from('\r\n'));

      parts.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="organs"\r\n\r\n${organs?.[i] ?? 'leaf'}\r\n`
      ));
    });

    parts.push(Buffer.from(`--${boundary}--\r\n`));
    const multipartBody = Buffer.concat(parts);

    const pnRes = await fetch(
      `https://my-api.plantnet.org/v2/identify/all?api-key=${process.env.PLANTNET_API_KEY}&include-related-images=false&no-reject=false&lang=en`,
      {
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
        body: multipartBody,
      }
    );
    if (!pnRes.ok) {
      const text = await pnRes.text();
      throw new Error(`PlantNet ${pnRes.status}: ${text}`);
    }

    const pnData = await pnRes.json();
    const results: Array<Record<string, unknown>> = pnData.results ?? [];
    if (results.length === 0) throw new Error('PlantNet could not identify the plant');

    // 2. Top-3 candidates
    type PNSpecies = { scientificNameWithoutAuthor?: string; scientificName?: string; commonNames?: string[]; genus?: { scientificNameWithoutAuthor?: string }; family?: { scientificNameWithoutAuthor?: string } };
    const candidates = results.slice(0, 3).map((r) => {
      const sp = (r.species ?? {}) as PNSpecies;
      return {
        scientificName: sp.scientificNameWithoutAuthor ?? sp.scientificName ?? 'Unknown',
        commonName: sp.commonNames?.[0] ?? sp.scientificNameWithoutAuthor ?? 'Unknown',
        genus: sp.genus?.scientificNameWithoutAuthor ?? '',
        family: sp.family?.scientificNameWithoutAuthor ?? '',
        score: (r.score as number) ?? 0,
      };
    });
    const topMatch = candidates[0];

    // 3. Run care + diagnosis in parallel — eliminates one sequential Gemini round-trip
    const ai = getGemini();

    const [care, diagnosis] = await Promise.all([
      // Care: served from species cache when available, otherwise generate and cache it
      (async () => {
        let c = await getCachedCare(topMatch.scientificName);
        if (!c) {
          if (!ai) return null;
          const careRes = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: `${CARE_PROMPT}\n\nPlant: ${topMatch.commonName} (${topMatch.scientificName})`,
            config: { responseMimeType: 'application/json', responseSchema: CARE_SCHEMA },
          });
          c = JSON.parse(careRes.text ?? '{}');
          await setCachedCare(topMatch.scientificName, topMatch.commonName, c);
        }
        return c;
      })(),
      // Diagnosis: always fresh — examines visible symptoms in the actual photos
      (async () => {
        if (!ai) return null;
        const diagParts: Array<Record<string, unknown>> = images.slice(0, 3).map((img: string) => {
          const [header, b64] = img.split(',');
          const mimeType = header.match(/data:(.*);/)?.[1] ?? 'image/jpeg';
          return { inlineData: { mimeType, data: b64 } };
        });
        diagParts.push({ text: `${DIAG_PROMPT}\n\nIdentified species: ${topMatch.commonName}. Focus on health symptoms only.` });
        const res = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: [{ role: 'user', parts: diagParts }],
          config: { responseMimeType: 'application/json', responseSchema: DIAG_SCHEMA },
        });
        return JSON.parse(res.text ?? '{}');
      })(),
    ]);

    if (!care) return NextResponse.json({ error: 'AI is not configured (GEMINI_API_KEY missing)' }, { status: 500 });

    return NextResponse.json({ candidates, topMatch, care, diagnosis });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
