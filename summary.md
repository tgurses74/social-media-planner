# Project Summary

**Project:** Social Media Posting Planner
**Owner:** okareefl@gmail.com (tgurses74 on GitHub)
**Repo:** https://github.com/tgurses74/social-media-planner (private)
**Current phase:** Phase 2 — Projects CRUD + Document Upload + Gemini Extraction — **in progress**
**Last updated:** 2026-04-20

---

## What this project is

A web app for event managers that:
1. **Plans** — User uploads an event brief (PDF, DOCX, etc.), AI reads it, and generates a full social media posting schedule (dates, captions, hashtags, media specs) across Facebook, Instagram, LinkedIn, and TikTok.
2. **Executes** — App sends a daily email reminder. User opens the app, uploads media for today's posts, and the app publishes to each platform.

Full product spec lives at [docs/PRD.md](./docs/PRD.md).

---

## Current state (Phase 1 — DONE ✅, Phase 2 — starting)

### What's built and working
- ✅ **Next.js 16** web app scaffolded (App Router, TypeScript, Tailwind v4, shadcn/ui)
- ✅ **Supabase Auth** wired up — email + password signup, login, session management via `proxy.ts`
- ✅ **Pages:** Login, Signup, auth callback, placeholder dashboard with sidebar + logout
- ✅ **PRD** written at `docs/PRD.md` (full spec, database schema, phased roadmap)
- ✅ **Workflow SOPs** at `workflows/` for the 4 main automations
- ✅ **Database schema** applied — `profiles`, `projects`, `event_documents`, `posts` with RLS policies
- ✅ **Auth flow verified end-to-end** — signup → dashboard works (email autoconfirm enabled for dev)
- ✅ **Self-hosted Supabase** running at `https://supabase-social.okare.tr` via Cloudflare Tunnel

### Supabase instance details (Oracle Cloud VPS — 140.245.209.173)
- Directory: `~/supabase-social/`
- Kong port: `127.0.0.1:8100`, fronted by Cloudflare Tunnel `okare-n8n-tunnel`
- Key env vars set: `ENABLE_EMAIL_AUTOCONFIRM=true`, `SITE_URL=http://localhost:3000`, `ADDITIONAL_REDIRECT_URLS=http://localhost:3000/**,https://supabase-social.okare.tr/**`
- **After any `docker compose down -v` (full wipe)** — three manual steps required before auth works:
  1. Run `volumes/db/_supabase.sql` via `docker cp + psql`
  2. Run `volumes/db/realtime.sql` via `docker cp + psql`
  3. Reassign all `auth` schema function ownership to `supabase_auth_admin`
  (See `docs/SETUP_SUPABASE.md` for full details)

---

## Stack

| Layer | Technology | Status |
|---|---|---|
| Frontend + Backend | Next.js 16 (App Router) | Installed |
| UI | Tailwind v4 + shadcn/ui | Installed |
| Auth + DB | Supabase (self-hosted at supabase.okare.tr) | Client wired; tables not yet created |
| Media storage | Cloudflare R2 (media.okare.tr, bucket `openborders-media`) | Not yet wired into app |
| AI | Google Gemini | Not yet wired into app |
| Email | Nodemailer + Gmail App Password | Not yet wired into app |
| Scheduling | Vercel Cron | Not yet configured |
| Publishing | Meta Graph, TikTok, LinkedIn APIs | Not yet wired into app |
| Hosting | Vercel | Not yet deployed |

---

## Immediate next actions (for the user)

Phase 2 is starting. Still needed in `.env.local` before Phase 2 features can run:

1. **Gemini API key** — https://aistudio.google.com/apikey → `GEMINI_API_KEY`
2. **Cloudflare R2** — Cloudflare dashboard → R2 → Manage API Tokens (S3 token)
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`

These can be filled in as we build each Phase 2 feature.

---

## Development roadmap

| Phase | Scope | Status |
|---|---|---|
| **1** | Scaffold, auth, PRD, git + GitHub | ✅ Done |
| **2** | Projects CRUD, document upload to R2, Gemini event extraction | 🔜 Next |
| **3** | AI content plan generation, editable calendar/table view | Pending |
| **4** | Media upload per post, publishing to all 4 platforms, status tracking | Pending |
| **5** | Daily Vercel Cron + notification email | Pending |
| **6** | Multi-tenancy (organizations), roles, polish, Vercel deploy | Pending |

---

## Outstanding / blocked items

| Item | Status / blocker |
|---|---|
| Supabase database tables created | ✅ Done — migration in `supabase/migrations/0001_initial_schema.sql` |
| LinkedIn Community Management API approval | **Blocked** — requires a separate LinkedIn app; can defer, use "Share on LinkedIn" in the current app for Phase 4 |
| Gmail App Password generated | **Not done** — needed before Phase 5 |
| Duplicate GitHub repo `social-media-posting-planner` | Exists but empty; optional to delete via GitHub web UI |
| Vercel project connected | **Not done** — needed before first production deploy (Phase 2+) |

---

## How to pick up next time

1. Open the project: `cd "/Users/tolga_mac/Desktop/AI PROJECTS/SOCIAL MEDIA AUTOMATION/AI SOCIAL MEDIA AUTOMATION"`
2. Run: `npm run dev` → [http://localhost:3000](http://localhost:3000) (redirects to `/login`)
3. Read: `docs/PRD.md` for product spec, `CLAUDE.md` for how the WAT framework works, this file for status
4. Tell Claude: "start Phase 2" to continue building

---

## Key files to know

| File | What it is |
|---|---|
| `docs/PRD.md` | Full product spec, database schema, all phases |
| `CLAUDE.md` | How agents (and Claude) should operate in this project |
| `README.md` | Quick-start + stack overview |
| `.env.example` | Template for secrets — **never commit the real `.env.local`** |
| `proxy.ts` | Next.js 16 auth middleware (route gating) |
| `lib/supabase/` | Supabase browser, server, and session helpers |
| `app/(auth)/` | Login, signup, and auth callback routes |
| `app/(app)/` | Authenticated app surfaces (dashboard etc.) |
| `workflows/*.md` | WAT framework SOPs for each automation |
