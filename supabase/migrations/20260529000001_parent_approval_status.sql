alter table profiles
  add column if not exists parent_approval_status text
    check (parent_approval_status in ('pending', 'approved', 'declined'));
