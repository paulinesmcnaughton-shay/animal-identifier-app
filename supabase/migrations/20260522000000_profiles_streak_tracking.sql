alter table public.profiles
  add column if not exists last_spotted_at timestamptz,
  add column if not exists rare_spotted integer not null default 0,
  add column if not exists badges_count integer not null default 0;

alter table public.profiles
  drop constraint if exists profiles_rare_spotted_nonnegative,
  add constraint profiles_rare_spotted_nonnegative check (rare_spotted >= 0),
  drop constraint if exists profiles_badges_count_nonnegative,
  add constraint profiles_badges_count_nonnegative check (badges_count >= 0);
