-- WildKind species catalog (run in Supabase SQL editor or via CLI)
create table if not exists public.species (
  id text primary key,
  slug text unique,
  dex_number text,
  common_name text not null,
  latin_name text,
  kingdom text,
  rarity text,
  conservation text,
  region text,
  sounds boolean default false,
  description text,
  gradient_start text,
  gradient_end text,
  image_url text,
  stats jsonb default '[]'::jsonb,
  vitals jsonb default '[]'::jsonb,
  taxonomy jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.species enable row level security;

create policy "species are readable by everyone"
  on public.species
  for select
  to anon, authenticated
  using (true);

create index if not exists species_slug_idx on public.species (slug);
