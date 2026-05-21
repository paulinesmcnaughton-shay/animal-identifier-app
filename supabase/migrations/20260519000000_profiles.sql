create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  location_text text,
  latitude double precision,
  longitude double precision,
  interests text[] not null default '{}',
  age_group text,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles readable by owner"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles insertable by owner"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles updatable by owner"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create index if not exists profiles_username_idx on public.profiles (username);
