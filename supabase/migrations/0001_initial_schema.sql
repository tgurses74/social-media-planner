-- Phase 1 schema — sourced from docs/PRD.md §5
-- Run this once in Supabase Studio → SQL Editor.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text default 'member' check (role in ('admin', 'member')),
  notification_email text,
  notification_time time default '08:00:00',
  timezone text default 'Europe/Istanbul',
  created_at timestamptz default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid,
  name text not null,
  event_name text not null,
  event_date date not null,
  description text,
  language text not null check (language in ('en', 'tr')),
  platforms text[] not null,
  timeframe_start date not null,
  timeframe_end date not null,
  status text default 'active' check (status in ('active', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table event_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  filename text not null,
  file_url text not null,
  mime_type text,
  size_bytes bigint,
  extracted_content jsonb,
  created_at timestamptz default now()
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  scheduled_date date not null,
  scheduled_time time,
  platform text not null check (platform in ('facebook', 'instagram', 'linkedin', 'tiktok')),
  post_type text not null,
  caption text not null,
  hashtags text[],
  media_spec jsonb not null,
  media_url text,
  status text not null default 'draft' check (
    status in ('draft', 'pending', 'media_ready', 'publishing', 'published', 'failed', 'cancelled')
  ),
  platform_post_id text,
  published_at timestamptz,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table projects enable row level security;
alter table posts enable row level security;
alter table event_documents enable row level security;
alter table profiles enable row level security;

create policy "users see own projects" on projects for all using (user_id = auth.uid());
create policy "users see own posts" on posts for all using (
  exists (select 1 from projects where projects.id = posts.project_id and projects.user_id = auth.uid())
);
create policy "users see own documents" on event_documents for all using (
  exists (select 1 from projects where projects.id = event_documents.project_id and projects.user_id = auth.uid())
);
create policy "users see own profile" on profiles for all using (id = auth.uid());

-- Auto-create a profile row when a new auth user is created.
-- Not in the PRD but required so the profiles table stays in sync with auth.users.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, notification_email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
