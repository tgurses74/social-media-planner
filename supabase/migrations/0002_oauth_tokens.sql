-- OAuth tokens for LinkedIn, TikTok (and any future platform OAuth)
create table if not exists oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('linkedin', 'tiktok')),
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  platform_user_id text,
  platform_user_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, platform)
);

alter table oauth_tokens enable row level security;

create policy "users manage own tokens"
  on oauth_tokens for all
  using (user_id = auth.uid());
