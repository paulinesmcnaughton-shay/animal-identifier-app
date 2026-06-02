create unique index if not exists profiles_username_unique
  on profiles (username)
  where username is not null;
