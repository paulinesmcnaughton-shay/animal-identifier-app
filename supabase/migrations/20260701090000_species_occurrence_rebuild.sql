-- Occurrence-ranked catalog rebuild support: commonness score + drop the slug
-- uniqueness (id is the key; different species can share a slug).
alter table public.species add column if not exists occurrence_count bigint;
alter table public.species drop constraint if exists species_slug_key;
