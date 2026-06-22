-- ============================================================
-- PlantVision — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Plants table: each plant belongs to a user (auth.users)
create table if not exists public.plants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plant_name text not null,
  scientific_name text,
  confidence text,
  watering_frequency text,
  watering_tips text,
  soil_health text,
  soil_health_details text,
  plant_health text,
  plant_health_details text,
  pot_size text,
  pot_size_reason text,
  immediate_attention boolean default false,
  immediate_attention_details text,
  care_tips jsonb default '[]'::jsonb,
  image_urls jsonb default '[]'::jsonb,   -- the 3 angle photos
  next_watering_due date,
  created_at timestamptz default now()
);

-- Row Level Security: users only see their own plants
alter table public.plants enable row level security;

create policy "Users read own plants"
  on public.plants for select
  using (auth.uid() = user_id);

create policy "Users insert own plants"
  on public.plants for insert
  with check (auth.uid() = user_id);

create policy "Users update own plants"
  on public.plants for update
  using (auth.uid() = user_id);

create policy "Users delete own plants"
  on public.plants for delete
  using (auth.uid() = user_id);

-- Storage bucket for plant photos
insert into storage.buckets (id, name, public)
values ('plant-photos', 'plant-photos', true)
on conflict (id) do nothing;

create policy "Anyone can view plant photos"
  on storage.objects for select
  using (bucket_id = 'plant-photos');

create policy "Authed users upload plant photos"
  on storage.objects for insert
  with check (bucket_id = 'plant-photos' and auth.role() = 'authenticated');
