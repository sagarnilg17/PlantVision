import { NextRequest, NextResponse } from 'next/server';
import { Type } from '@google/genai';
import { getServerUser } from '@/lib/supabaseServer';
import { getGemini, GEMINI_MODEL } from '@/lib/gemini';
import { getCachedCare, setCachedCare } from '@/lib/speciesCache';

// Cap total base64 payload (~15 MB) so the identify endpoint can't be used to
// fan out huge requests to the paid PlantNet / Gemini APIs.
const MAX_TOTAL_CHARS = 20_000_000;

const CARE_PROMPT = `You are a houseplant care expert. Give concise, practical care info for the plant below. Use "Every X days" or "Every X-Y days" for wateringFrequency. Provide exactly 3 short careTips. toxicityNotes: one sentence naming which animals/people it is toxic to and the effect, or "Non-toxic to pets and humans."`;

// Native structured output — no more regex-scraping JSON from free text.
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

    // 1. Build multipart body manually so each image part carries the correct
    //    Content-Type header — Node.js's FormData/File globals don't reliably
    //    include per-part MIME types when serialised by undici's fetch.
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

    // 2. Build top-3 candidates from PlantNet results
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

    // 3. Care info — served from the species cache when available, else generated
    //    by Gemini (structured JSON) and cached for the next scan of this species.
    let care = await getCachedCare(topMatch.scientificName);
    if (!care) {
      const ai = getGemini();
      if (!ai) return NextResponse.json({ error: 'AI is not configured (GEMINI_API_KEY missing)' }, { status: 500 });
      const careRes = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `${CARE_PROMPT}\n\nPlant: ${topMatch.commonName} (${topMatch.scientificName})`,
        config: { responseMimeType: 'application/json', responseSchema: CARE_SCHEMA },
      });
      care = JSON.parse(careRes.text ?? '{}');
      await setCachedCare(topMatch.scientificName, topMatch.commonName, care);
    }

    return NextResponse.json({ candidates, topMatch, care });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
