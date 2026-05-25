-- WildKind community sightings: privacy + owner for map Nearby layer 2.

alter table public.community_sightings
  add column if not exists user_id uuid references public.profiles (id) on delete set null,
  add column if not exists privacy text not null default 'private';

alter table public.community_sightings
  drop constraint if exists community_sightings_privacy_check,
  add constraint community_sightings_privacy_check
    check (privacy in ('private', 'anonymous', 'public'));

create index if not exists community_sightings_privacy_idx
  on public.community_sightings (privacy);

create index if not exists community_sightings_user_id_idx
  on public.community_sightings (user_id);

-- Backfill seeded demo rows as anonymous map pins.
update public.community_sightings
set privacy = 'anonymous'
where privacy = 'private' and user_id is null;

drop policy if exists "community_sightings readable by authenticated" on public.community_sightings;

create policy "community_sightings map and own rows"
  on public.community_sightings
  for select
  to authenticated
  using (
    privacy in ('anonymous', 'public')
    or auth.uid() = user_id
  );

create policy "community_sightings insert own"
  on public.community_sightings
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "community_sightings update own"
  on public.community_sightings
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "community_sightings delete own"
  on public.community_sightings
  for delete
  to authenticated
  using (auth.uid() = user_id);
