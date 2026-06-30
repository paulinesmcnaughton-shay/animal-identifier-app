-- Private "suggest a photo" queue. Submissions land in a private bucket + a
-- pending row; nothing is shown to other users until reviewed and approved.
create table if not exists public.species_photo_suggestions (
  id uuid primary key default gen_random_uuid(),
  species_id text not null,
  species_name text not null,
  latin_name text,
  submitted_by uuid references auth.users(id) on delete set null,
  storage_path text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);
alter table public.species_photo_suggestions enable row level security;

drop policy if exists "users submit photo suggestions" on public.species_photo_suggestions;
create policy "users submit photo suggestions"
  on public.species_photo_suggestions for insert
  to authenticated with check (submitted_by = auth.uid());

drop policy if exists "users read own suggestions" on public.species_photo_suggestions;
create policy "users read own suggestions"
  on public.species_photo_suggestions for select
  to authenticated using (submitted_by = auth.uid());

insert into storage.buckets (id, name, public)
values ('photo-suggestions', 'photo-suggestions', false)
on conflict (id) do nothing;

drop policy if exists "users upload own suggestion photos" on storage.objects;
create policy "users upload own suggestion photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'photo-suggestions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
