import { createClient } from '@supabase/supabase-js';

// Care info for a given species is stable, so we cache it in Supabase keyed by
// scientific name to avoid regenerating (and re-paying for) it on every scan.
// Uses the service-role key (server-only) so writes bypass RLS. If the key isn't
// set the cache silently no-ops and every scan just calls Gemini.

function cacheClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function getCachedCare(scientificName: string): Promise<Record<string, unknown> | null> {
  const c = cacheClient();
  if (!c || !scientificName) return null;
  try {
    const { data } = await c
      .from('species_care')
      .select('care')
      .eq('scientific_name', scientificName)
      .maybeSingle();
    return (data?.care as Record<string, unknown>) ?? null;
  } catch {
    return null;
  }
}

export async function setCachedCare(scientificName: string, commonName: string, care: unknown): Promise<void> {
  const c = cacheClient();
  if (!c || !scientificName) return;
  try {
    await c.from('species_care').upsert(
      { scientific_name: scientificName, common_name: commonName, care },
      { onConflict: 'scientific_name' },
    );
  } catch {
    /* cache write is best-effort */
  }
}
