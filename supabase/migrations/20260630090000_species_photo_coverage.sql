-- Photo-coverage tracking for the pre-warm batch. image_url stays null on the
-- catalog row (the cache holds the attributed copy); we only record whether a
-- free photo exists so coverage is queryable and the batch is resumable.
alter table public.species
  add column if not exists image_checked_at timestamptz,
  add column if not exists has_photo boolean;
create index if not exists species_unchecked_idx
  on public.species (dex_number) where image_checked_at is null;
