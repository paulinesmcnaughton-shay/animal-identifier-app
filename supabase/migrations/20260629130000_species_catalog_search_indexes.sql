-- Search/browse indexes for the imported GBIF species catalog (~34k rows).
create extension if not exists pg_trgm;
create index if not exists species_common_trgm on public.species using gin (common_name gin_trgm_ops);
create index if not exists species_latin_trgm on public.species using gin (latin_name gin_trgm_ops);
create index if not exists species_dex_idx on public.species (dex_number);
create index if not exists species_kingdom_idx on public.species (kingdom);
