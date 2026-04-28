# Project Summary

**Project:** Social Media Posting Planner
**Owner:** okareefl@gmail.com (tgurses74 on GitHub)
**Repo:** https://github.com/tgurses74/social-media-planner (public)
**Live URL:** https://socialplanner.okare.tr
**Vercel project:** `socialplanner` · team `okareefls-projects`
**Last updated:** 2026-04-28

---

## What this project is

A web app for event managers that:
1. **Plans** — User uploads an event brief (PDF, DOCX, etc.), Gemini AI reads it, and generates a full social media posting schedule (dates, captions, hashtags, media specs) across Facebook, Instagram, LinkedIn, and TikTok.
2. **Executes** — App sends a daily email reminder. User opens the app, uploads media for today's posts, and the app publishes to each platform with one click.

Full product spec: [`docs/PRD.md`](./docs/PRD.md)
New builder onboarding: [`FIRST_READ_THIS.md`](./FIRST_READ_THIS.md)

---

## Current State — ALL PHASES COMPLETE ✅ — APP IS LIVE

### Features working in production

| Feature | Status | Notes |
|---|---|---|
| Auth (email + password) | ✅ Live | Supabase Auth via cookie-based session |
| Projects CRUD | ✅ Live | Create, view, edit, delete projects |
| Document upload + Gemini extraction | ✅ Live | PDF, DOCX, images → R2 → Gemini |
| AI content plan generation | ✅ Live | Gemini generates full schedule |
| Editable content calendar | ✅ Live | Inline edit caption, hashtags, date |
| Image upload (posts) | ✅ Live | Proxy through Vercel → R2 |
| Video upload (posts) | ✅ Live | Presigned PUT URL → direct browser → R2 |
| Facebook publishing | ✅ Live | Meta Graph API v25.0 |
| Instagram publishing | ✅ Live | Meta Graph API v25.0 (with container polling) |
| TikTok OAuth connect | ✅ Live | PKCE state, cookie CSRF |
| TikTok publishing | ✅ Live | TikTok Content Posting API |
| LinkedIn OAuth connect | ✅ Live | OAuth 2.0, callback registered in dev portal |
| LinkedIn publishing | ✅ Live | LinkedIn Share API |
| Daily notification emails | ✅ Live | Vercel Cron → Nodemailer → Gmail |
| Settings page | ✅ Live | Platform connections, notification prefs |
| Today dashboard | ✅ Live | All today's posts across all projects |

---

## Infrastructure

| Component | Details |
|---|---|
| **Next.js app** | Vercel, Node.js 24.x, Turbopack build, `main` branch auto-deploys |
| **Supabase** | Self-hosted Docker Compose on Oracle Cloud VPS (140.245.209.173) at `~/supabase-social/` |
| **Cloudflare Tunnel** | `okare-n8n-tunnel` → exposes Supabase as `supabase-social.okare.tr` |
| **Cloudflare R2** | Bucket `openborders-media`, custom domain `media.okare.tr` |
| **Cloudflare Bot Fight Mode** | **Must remain OFF** for `okare.tr` — otherwise Vercel → Supabase calls get blocked |

### Supabase VPS recovery (after `docker compose down -v` full wipe)
Three manual steps required before auth works again:
1. Run `volumes/db/_supabase.sql` via `docker cp + psql`
2. Run `volumes/db/realtime.sql` via `docker cp + psql`
3. Reassign all `auth` schema function ownership to `supabase_auth_admin`

See `docs/SETUP_SUPABASE.md` for exact commands.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend + Backend | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui |
| Auth + DB | Supabase (self-hosted at `supabase-social.okare.tr`) |
| Media storage | Cloudflare R2 (`media.okare.tr`, bucket `openborders-media`) |
| AI | Google Gemini API (gemini-1.5-flash) |
| Email | Nodemailer + Gmail App Password |
| Scheduling | Vercel Cron Jobs |
| Publishing | Meta Graph API v25.0, TikTok Content Posting API, LinkedIn Share API |
| Hosting | Vercel (`socialplanner.okare.tr`) |

---

## Critical Gotchas (hard-won lessons)

1. **`getSession()` not `getUser()`** in all server/API code — `getUser()` makes a network call that Cloudflare blocks
2. **Cloudflare Bot Fight Mode OFF** for `okare.tr` — server-to-server calls get classified as bots
3. **Instagram container polling required for ALL types** (images + videos) — skipping causes error 9007
4. **Video uploads bypass Vercel** via presigned R2 URLs — Vercel has a hard 4.5 MB body limit
5. **LinkedIn redirect_uri must be registered** in LinkedIn Developer Portal for production
6. **R2 CORS policy required** for presigned video uploads (allow PUT from `socialplanner.okare.tr`)

Full details: [`FIRST_READ_THIS.md`](./FIRST_READ_THIS.md) Section 5.

---

## Development roadmap

| Phase | Scope | Status |
|---|---|---|
| **1** | Scaffold, auth, PRD, git + GitHub | ✅ Done |
| **2** | Projects CRUD, document upload to R2, Gemini event extraction | ✅ Done |
| **3** | AI content plan generation, editable calendar/table view | ✅ Done |
| **4** | Media upload per post, publishing to all 4 platforms, status tracking | ✅ Done |
| **5** | Daily Vercel Cron + notification email | ✅ Done |
| **6** | Multi-tenancy, roles, polish, Vercel deploy | ✅ Done |

---

## How to pick up next time

1. Clone: `git clone https://github.com/tgurses74/social-media-planner.git`
2. Install: `npm install`
3. Copy env: `cp .env.example .env.local` and fill in values
4. Run: `npm run dev` → http://localhost:3000
5. Read: `FIRST_READ_THIS.md` → `docs/PRD.md` → this file

**Key things to know before writing any code:** Read Section 5 of `FIRST_READ_THIS.md`.
