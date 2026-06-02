alter table profiles add column if not exists age_verified boolean default false;
update profiles set age_verified = true where onboarding_complete = true;
