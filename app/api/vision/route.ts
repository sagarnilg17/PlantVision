import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType, prompt } = await req.json();

    if (!imageBase64 || !mediaType) {
      return NextResponse.json({ error: 'Missing imageBase64 or mediaType' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mediaType,
          data: imageBase64,
        },
      },
      prompt || 'Describe what you see in this image in detail.',
    ]);

    const text = result.response.text();

    return NextResponse.json({
      result: text,
      model: 'gemini-1.5-flash',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
