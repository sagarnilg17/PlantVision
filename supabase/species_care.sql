-- Species-level care cache. Care info for a given species is stable, so it's
-- generated once by Gemini and reused on every later scan of that species.
-- Written server-side with the service-role key (which bypasses RLS), so RLS is
-- enabled with no policies — no client (anon/authenticated) can read or write it
-- directly. Run this once in the Supabase SQL editor.

create table if not exists public.species_care (
  scientific_name text primary key,
  common_name     text,
  care            jsonb       not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.species_care enable row level security;
-- (intentionally no policies: only the service role touches this table)

-- keep updated_at fresh on upsert
create or replace function public.species_care_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists species_care_touch on public.species_care;
create trigger species_care_touch
  before update on public.species_care
  for each row execute function public.species_care_touch();
