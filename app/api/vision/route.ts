import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' });

const CARE_PROMPT = `You are a houseplant care expert. Given a species, return ONLY valid JSON — no extra text:

{
  "wateringFrequency": "Every X-Y days",
  "wateringTips": "One concise watering tip",
  "potSize": "e.g. 6-inch pot",
  "potSizeReason": "One sentence why",
  "careTips": ["tip 1", "tip 2", "tip 3"],
  "toxicToAnimals": true,
  "toxicToHumans": false,
  "toxicityNotes": "One sentence: which animals/people it is toxic to and the effect, or 'Non-toxic to pets and humans.'"
}

Use "Every X days" or "Every X-Y days" format for wateringFrequency. Be concise and practical.`;

export async function POST(req: NextRequest) {
  try {
    const { images, organs } = await req.json();
    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
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

    // 3. Ask Groq for care info based on the identified species
    const careRes = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: `${CARE_PROMPT}\n\nPlant: ${topMatch.commonName} (${topMatch.scientificName})`,
        },
      ],
      max_tokens: 500,
    });

    const careRaw = careRes.choices[0]?.message?.content ?? '';
    const careMatch = careRaw.match(/\{[\s\S]*\}/);
    if (!careMatch) throw new Error('Could not parse care data');
    const care = JSON.parse(careMatch[0]);

    return NextResponse.json({ candidates, topMatch, care });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
