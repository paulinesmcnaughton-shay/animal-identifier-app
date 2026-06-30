-- CC-BY attribution for cached reference images (Wikimedia author/license/source).
alter table public.species_image_cache
  add column if not exists attribution_author text,
  add column if not exists attribution_license text,
  add column if not exists attribution_source_url text;
