alter table profiles
  add column if not exists parent_approval_token text,
  add column if not exists parent_approval_token_expires_at timestamptz;
