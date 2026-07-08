-- Legal consent record for photo submissions (exact wording + version stored
-- per-submission so it stays defensible even if copy changes later).
alter table public.species_photo_suggestions
  add column if not exists consent_given boolean not null default false,
  add column if not exists consent_version text,
  add column if not exists consent_text text,
  add column if not exists consented_at timestamptz,
  add column if not exists kingdom text,
  add column if not exists dex_number text,
  add column if not exists is_domestic boolean not null default false;

-- Require consent at the DATABASE level too, not just client-side.
drop policy if exists "users submit photo suggestions" on public.species_photo_suggestions;
create policy "users submit photo suggestions"
  on public.species_photo_suggestions for insert
  to authenticated
  with check (submitted_by = auth.uid() and consent_given = true);

-- Single admin (this project's operator) reads every submission for review,
-- matched by the email of their own WildKind sign-in — no separate admin login.
drop policy if exists "admin reads all photo suggestions" on public.species_photo_suggestions;
create policy "admin reads all photo suggestions"
  on public.species_photo_suggestions for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'text4backend@gmail.com');

drop policy if exists "admin reads all photo suggestion uploads" on storage.objects;
create policy "admin reads all photo suggestion uploads"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'photo-suggestions' and (auth.jwt() ->> 'email') = 'text4backend@gmail.com');
