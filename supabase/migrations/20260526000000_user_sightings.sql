-- Personal sightings: Wild Dex collection + My Sightings map (per user, persistent).

create table if not exists public.user_sightings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  species_id text not null,
  species_name text not null,
  kingdom text not null,
  latin_name text,
  dex_number text,
  confidence real,
  is_domestic boolean not null default false,
  photo_uri text,
  latitude double precision,
  longitude double precision,
  spotted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.user_sightings enable row level security;

create policy "user_sightings select own"
  on public.user_sightings
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_sightings insert own"
  on public.user_sightings
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_sightings delete own"
  on public.user_sightings
  for delete
  to authenticated
  using (auth.uid() = user_id);

create index if not exists user_sightings_user_id_idx
  on public.user_sightings (user_id);

create index if not exists user_sightings_user_spotted_at_idx
  on public.user_sightings (user_id, spotted_at desc);

create index if not exists user_sightings_user_species_idx
  on public.user_sightings (user_id, species_id);
