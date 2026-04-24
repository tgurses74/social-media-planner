# Product Requirements Document — Social Media Posting Planner

> **Audience:** developers, AI agents, and stakeholders picking up this project at any phase.
> **Last updated:** Phase 1 scaffold.

---

## 1. Product Summary

A private, multi-tenant web application that helps event managers plan and execute social media campaigns for multiple events simultaneously. The app uses AI (Google Gemini) to read event documents and generate complete, editable social media posting schedules — then handles the publishing to Facebook, Instagram, TikTok, and LinkedIn.

### Core Value Proposition
Event managers typically spend hours per event manually planning social media posts, writing captions, and coordinating media uploads. This app compresses that into minutes: upload the event brief → AI generates the entire calendar → review and publish.

### Target User
- **Now:** internal team of 2-5 event managers working on multiple events concurrently
- **Future:** external clients managing their own events through the platform

---

## 2. Core Concepts & Terminology

| Term | Definition |
|---|---|
| **Project** | One event being promoted (e.g., "Istanbul Design Festival 2026"). Has a start date, end date (event day), platforms, and language. |
| **Post** | A single scheduled social media item inside a project. Has date, platform, type, caption, hashtags, media spec, and status. |
| **Media spec** | AI-generated description of what media the user needs to upload (e.g., "Vertical video, 9:16, 1080×1920, max 15s, max 50MB"). |
| **Publishing** | The act of pushing a post to the live social media platform via its API. |

---

## 3. Architecture Overview

### 3.1 Stack Summary

| Layer | Technology | Hosting |
|---|---|---|
| Frontend + Backend | Next.js 16 (App Router, React Server Components) | Vercel |
| Authentication | Supabase Auth | supabase.okare.tr |
| Database | Supabase PostgreSQL | supabase.okare.tr |
| Media Storage | Cloudflare R2 (S3-compatible) | media.okare.tr |
| AI | Google Gemini API (multimodal for documents + text for captions) | Google |
| Email | Nodemailer over Gmail App Password | okareefl@gmail.com |
| Scheduling | Vercel Cron Jobs | Vercel |
| Social Publishing | Meta Graph API, TikTok Content Posting API, LinkedIn Marketing API | Direct |

### 3.2 Why These Choices

- **Next.js 16 on Vercel**: fast deployment, serverless functions for API routes, Cron Jobs native support, image optimization.
- **Supabase**: already running, provides Auth + Postgres + row-level security in one. Migrations are easy.
- **Cloudflare R2**: Meta (Facebook/Instagram) APIs require publicly accessible media URLs. R2 provides this at `media.okare.tr` with zero egress fees.
- **Gemini**: free tier suffices for the expected volume; multimodal handles PDF/JPG/DOCX natively.
- **Vercel Cron**: no n8n dependency for app scheduling — keeps the app self-contained.

### 3.3 Request Flow Diagram

```
[User] → Next.js App (Vercel)
           ├── Server Components → Supabase DB (reads)
           ├── Server Actions → Supabase DB (writes)
           ├── Route Handlers → Gemini API (AI generation)
           │                  → Cloudflare R2 (media upload)
           │                  → Meta/TikTok/LinkedIn APIs (publishing)
           └── Vercel Cron (daily) → Email via Nodemailer
```

---

## 4. Feature Specification

### 4.1 Authentication & User Management

**Phase 1 scope:**
- Email + password sign up via Supabase Auth
- Email confirmation required before login
- Session managed via HTTP-only cookies (Supabase SSR helpers)
- Protected routes enforced via Next.js `proxy.ts` (middleware)

**Future scope:**
- Team invites (add member to an organization)
- Role-based access: Admin, Member, Client
- SSO/OAuth providers

**Key files:**
- `lib/supabase/client.ts` — browser-side Supabase client
- `lib/supabase/server.ts` — server-side client with cookie handling
- `proxy.ts` — auth gate redirecting unauthenticated users to `/login`
- `app/(auth)/login/page.tsx` — login form
- `app/(auth)/signup/page.tsx` — signup form
- `app/(auth)/callback/route.ts` — email confirmation handler

### 4.2 Projects

**Create Project Flow:**
1. User clicks "New Project"
2. Enters project name, event name, event date, description
3. Selects language (English or Turkish)
4. Selects platforms (checkboxes: Facebook, Instagram, LinkedIn, TikTok)
5. Sets posting timeframe (start date → end date; default: today → event date)
6. Uploads event documents (drag-and-drop, multiple files)
7. System uploads files to Cloudflare R2, stores URLs in `event_documents` table
8. Gemini extracts key event info from documents
9. User reviews and edits extracted info
10. User clicks "Generate Plan"
11. Gemini generates full posting schedule → saved as `posts` rows
12. User redirected to project view with editable calendar

**Project Views:**
- Grid/Table: sortable by date, platform, status
- Calendar: month view with posts as chips
- Timeline: Gantt-style for event lead-up view

### 4.3 Posts (Content Plan)

**Each post has:**
- `scheduled_date` (date + optional time)
- `platform` (enum: facebook, instagram, linkedin, tiktok)
- `post_type` (enum: post, story, reel, carousel, video, short — varies per platform)
- `caption` (text; editable)
- `hashtags` (array of strings; editable)
- `media_spec` (JSON: type, orientation, ratio, min/max resolution, min/max size, duration)
- `media_url` (Cloudflare R2 URL; populated when user uploads)
- `status` (enum: draft, pending, media_ready, publishing, published, failed)
- `published_at` (timestamp; set when successfully posted)
- `error_message` (text; populated on failure)
- `platform_post_id` (string; returned by platform API after publishing)

**Editing capabilities:**
- Inline edit date, caption, hashtags
- Regenerate caption or hashtags with AI (single-post level)
- Cancel post (soft delete → status: cancelled)
- Add new post manually

### 4.4 Daily Execution (Section 2)

**Daily Email (Vercel Cron, 8:00 AM user timezone):**
- Query posts where `scheduled_date = today` AND `status IN (pending, media_ready)`
- Group by project
- Send email to user's `notification_email` listing today's posts + app link

**Dashboard "Today" view:**
- Default landing after login
- Grouped cards per project
- Each post card shows: platform icon, post type, time, status badge

**Publishing Modal (click a post):**
- Full caption (editable one last time)
- Hashtags (editable)
- Media spec displayed prominently
- Drag-and-drop media upload → Cloudflare R2 → preview
- "Publish Now" button → calls platform API
- Real-time status update (Publishing → Published or Failed)

### 4.5 Platform Publishing

Each platform has its own Route Handler in `app/api/publish/[platform]/route.ts`:
- `app/api/publish/meta/route.ts` — handles Facebook and Instagram (Meta Graph API)
- `app/api/publish/tiktok/route.ts` — TikTok Content Posting API
- `app/api/publish/linkedin/route.ts` — LinkedIn Share + OpenID Connect

All publish handlers:
1. Validate post is in `media_ready` status and owned by user
2. Mark post as `publishing`
3. Call platform API with caption, hashtags, and media URL
4. On success: update to `published`, store `platform_post_id` and `published_at`
5. On failure: update to `failed`, store `error_message`
6. Return status to client for UI update

---

## 5. Database Schema (Supabase Postgres)

```sql
-- Users handled by Supabase Auth (auth.users)
-- We extend with a profiles table for app-specific data

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
  org_id uuid, -- for future multi-tenancy
  name text not null,
  event_name text not null,
  event_date date not null,
  description text,
  language text not null check (language in ('en', 'tr')),
  platforms text[] not null, -- ['facebook', 'instagram', 'linkedin', 'tiktok']
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
  file_url text not null, -- Cloudflare R2 URL
  mime_type text,
  size_bytes bigint,
  extracted_content jsonb, -- Gemini's structured extraction
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

-- Row Level Security: users can only see their own data
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
```

---

## 6. Environment Variables

See `.env.example` in the project root for the full list. Key variables:

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://supabase.okare.tr` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public, for browser clients |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only, bypasses RLS |
| `GEMINI_API_KEY` | Google AI Studio |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Cloudflare R2 S3 credentials |
| `R2_BUCKET_NAME` | `openborders-media` |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | `https://media.okare.tr` |
| `META_APP_ID`, `META_APP_SECRET`, `META_PAGE_ACCESS_TOKEN` | Meta Graph API |
| `META_PAGE_ID`, `META_INSTAGRAM_ACCOUNT_ID` | From Technical Information doc |
| `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` | TikTok Developer Portal |
| `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | LinkedIn Developer Portal |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | For daily notification emails |

**Secrets management:** `.env.local` is gitignored. Production secrets go into Vercel Project Settings → Environment Variables.

---

## 7. Development Phases

| Phase | Goal | Status |
|---|---|---|
| 1 | Project scaffold, auth, PRD | In progress (this phase) |
| 2 | Projects CRUD + document upload + Gemini extraction | Not started |
| 3 | AI content generation (full plan) + editable calendar | Not started |
| 4 | Media upload + publishing (Meta, TikTok, LinkedIn) | Not started |
| 5 | Daily cron + notification emails | Not started |
| 6 | Multi-tenancy + roles + polish | Not started |

---

## 8. Verification Checklist (End of Phase 1)

- [ ] `npm run dev` starts without errors
- [ ] Landing page at `/` redirects unauthenticated users to `/login`
- [ ] Signup page creates a Supabase Auth user and sends confirmation email
- [ ] Login page authenticates and redirects to `/dashboard`
- [ ] Dashboard shows a placeholder "Welcome" view
- [ ] Logout clears the session
- [ ] `.env.local` is gitignored (not in `git status`)
- [ ] Git initialized, initial commit pushed to GitHub

---

## 9. Open Decisions / Deferred

- **Gemini model version**: defer to Phase 2 (pick fastest multimodal model available at build time)
- **Document parsing**: Gemini handles PDF/images natively. For DOCX/XLSX/PPTX may need pre-parsing with `mammoth`/`xlsx`/`pptx-parser`. Decide in Phase 2 based on file types actually uploaded.
- **LinkedIn OAuth flow**: defer until Community Management API access is approved (separate LinkedIn app required per LinkedIn policy). Keep Share on LinkedIn + Sign In with LinkedIn working from current app.
- **Media format auto-conversion**: if user uploads wrong ratio/size, should app reject or auto-convert? Decide in Phase 4.
