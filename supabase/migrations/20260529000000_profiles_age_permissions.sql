-- Age-based account fields for COPPA/GDPR compliance and family safety controls

alter table profiles
  add column if not exists date_of_birth date,
  add column if not exists account_type text check (account_type in ('child', 'teen', 'adult')) default 'adult',
  add column if not exists parent_name text,
  add column if not exists parent_email text,
  add column if not exists parent_permission_confirmed boolean not null default false,
  add column if not exists family_account_enabled boolean not null default false,
  add column if not exists can_publish_to_nearby boolean not null default false,
  add column if not exists show_username_on_map boolean not null default false,
  add column if not exists requires_parent_setup boolean not null default false;
