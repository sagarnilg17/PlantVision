import { GoogleGenAI } from '@google/genai';

// Gemini 2.5 Flash: fast, vision-capable, generous free tier, native JSON output.
export const GEMINI_MODEL = 'gemini-2.5-flash';

let client: GoogleGenAI | null = null;

/** Returns a Gemini client, or null if GEMINI_API_KEY isn't configured. */
export function getGemini(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}
