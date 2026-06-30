-- Launch waitlist for the upcoming Wildpanion buddy feature (insert-only).
create table if not exists public.wildpanion_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);
alter table public.wildpanion_waitlist enable row level security;
drop policy if exists "anyone can join wildpanion waitlist" on public.wildpanion_waitlist;
create policy "anyone can join wildpanion waitlist"
  on public.wildpanion_waitlist for insert
  to anon, authenticated
  with check (true);
