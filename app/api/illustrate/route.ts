import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabaseServer';

const PROMPT_SUFFIX =
  ', isolated on a pure white background, detailed natural leaves and stems, muted natural greens and earth tones, elegant fine-art watercolor style, no text, no labels, centered composition';

export async function POST(req: Request) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { speciesName } = await req.json();
    if (typeof speciesName !== 'string' || speciesName.trim().length === 0 || speciesName.length > 120) {
      return NextResponse.json({ error: 'Invalid species name' }, { status: 400 });
    }
    const prompt = `Soft botanical watercolor illustration of ${speciesName}${PROMPT_SUFFIX}`;

    // Production: DALL-E 3 (set OPENAI_API_KEY in Vercel env)
    if (process.env.OPENAI_API_KEY) {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          response_format: 'url',
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? 'DALL-E failed');
      }
      const data = await res.json();
      return NextResponse.json({ url: data.data[0].url, source: 'dalle' });
    }

    // Free fallback: Pollinations.ai — no API key needed, URL is permanent/cached
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&nologo=true&model=flux`;
    return NextResponse.json({ url, source: 'pollinations' });

  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 });
  }
}
