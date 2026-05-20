create table if not exists public.domestic_species (
  id uuid default gen_random_uuid() primary key,
  common_name text unique not null,
  latin_name text,
  dex_number text unique not null,
  kingdom text default 'Mammalia',
  speed integer,
  stamina integer,
  size integer,
  rarity integer,
  lifespan text,
  diet text,
  top_speed text,
  region text,
  reference_image_url text
);

alter table public.domestic_species enable row level security;

create policy "domestic_species are readable by everyone"
  on public.domestic_species
  for select
  to anon, authenticated
  using (true);

create index if not exists domestic_species_dex_number_idx on public.domestic_species (dex_number);
create index if not exists domestic_species_common_name_idx on public.domestic_species (common_name);
