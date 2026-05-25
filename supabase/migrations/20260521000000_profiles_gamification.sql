-- Gamification stats on profiles (home header, weekly quest, collector tier).

alter table public.profiles
  add column if not exists level integer not null default 1,
  add column if not exists xp integer not null default 0,
  add column if not exists streak_days integer not null default 0,
  add column if not exists spots_captured integer not null default 0,
  add column if not exists weekly_quest_title text not null default 'Spot 3 insects this week',
  add column if not exists weekly_quest_current integer not null default 0,
  add column if not exists weekly_quest_total integer not null default 3,
  add column if not exists weekly_quest_xp_reward integer not null default 50,
  add column if not exists weekly_quest_started_at timestamptz not null default now();

alter table public.profiles
  drop constraint if exists profiles_level_positive,
  add constraint profiles_level_positive check (level >= 1),
  drop constraint if exists profiles_streak_nonnegative,
  add constraint profiles_streak_nonnegative check (streak_days >= 0),
  drop constraint if exists profiles_spots_nonnegative,
  add constraint profiles_spots_nonnegative check (spots_captured >= 0),
  drop constraint if exists profiles_weekly_quest_current_valid,
  add constraint profiles_weekly_quest_current_valid check (
    weekly_quest_current >= 0
    and weekly_quest_current <= weekly_quest_total
  ),
  drop constraint if exists profiles_weekly_quest_total_positive,
  add constraint profiles_weekly_quest_total_positive check (weekly_quest_total >= 1);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
