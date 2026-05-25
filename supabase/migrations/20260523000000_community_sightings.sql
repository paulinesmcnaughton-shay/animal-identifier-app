-- Aggregated public sightings from other explorers (map Nearby tab).

create table if not exists public.community_sightings (
  id uuid primary key default gen_random_uuid(),
  species_name text not null,
  species_id text,
  kingdom text not null,
  latitude double precision not null,
  longitude double precision not null,
  spotted_at timestamptz not null default now(),
  report_count integer not null default 1,
  created_at timestamptz not null default now()
);

alter table public.community_sightings enable row level security;

create policy "community_sightings readable by authenticated"
  on public.community_sightings
  for select
  to authenticated
  using (true);

create index if not exists community_sightings_geo_idx
  on public.community_sightings (latitude, longitude);

create index if not exists community_sightings_spotted_at_idx
  on public.community_sightings (spotted_at desc);

-- Seed demo spots near Hyde Park (map fallback anchor) for Nearby until real reports exist.
insert into public.community_sightings (
  species_name, species_id, kingdom, latitude, longitude, spotted_at, report_count
)
select * from (values
  ('Red Fox', 'fox', 'mammal', 51.5076, -0.0962, now() - interval '2 hours', 3),
  ('European Robin', 'cardinal', 'bird', 51.5084, -0.0850, now() - interval '1 day', 5),
  ('Monarch Butterfly', 'monarch', 'insect', 51.5043, -0.0813, now() - interval '3 days', 2),
  ('European Badger', 'badger', 'mammal', 51.5019, -0.0948, now() - interval '8 days', 4),
  ('Blue Jay', 'owl', 'bird', 51.5028, -0.0854, now() - interval '12 days', 1),
  ('Brown Hare', 'deer', 'mammal', 51.5091, -0.0905, now() - interval '5 hours', 2),
  ('Palmate Newt', 'frog', 'amphibian', 51.5058, -0.0985, now() - interval '4 days', 6),
  ('Tawny Owl', 'owl', 'bird', 51.5034, -0.0973, now() - interval '9 days', 3)
) as seed(species_name, species_id, kingdom, latitude, longitude, spotted_at, report_count)
where not exists (select 1 from public.community_sightings limit 1);
