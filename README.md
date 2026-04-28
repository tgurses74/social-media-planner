# Social Media Posting Planner

A Next.js 16 web app that helps event managers plan and publish social media content across Facebook, Instagram, LinkedIn, and TikTok using AI.

**Live:** https://socialplanner.okare.tr

---

## What it does

1. **Plan** — Upload an event brief (PDF, DOCX, image). Gemini AI reads it and generates a full posting calendar with captions, hashtags, and media specs.
2. **Execute** — Daily email digest lists today's posts. User opens the app, uploads media, and publishes to all platforms with one click.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind v4 + shadcn/ui — Vercel
- **Supabase** — auth + Postgres (self-hosted at `supabase-social.okare.tr` via Cloudflare Tunnel on Oracle Cloud VPS)
- **Cloudflare R2** — media storage (`media.okare.tr`)
- **Google Gemini** — document reading and content generation
- **Meta Graph API v25.0** — Facebook + Instagram publishing
- **TikTok Content Posting API** — TikTok publishing
- **LinkedIn Share API** — LinkedIn publishing
- **Vercel Cron + Nodemailer** — daily notification emails

## Quick start

```bash
git clone https://github.com/tgurses74/social-media-planner.git
cd social-media-planner
npm install
cp .env.example .env.local   # fill in all values
npm run dev                  # http://localhost:3000
```

## ⚠️ Read before coding

**`FIRST_READ_THIS.md`** — critical infrastructure gotchas, troubleshooting guide, and workflow explanation. Required reading before making changes.

## Project structure

```
app/
  (auth)/       Login, signup, auth callback
  (app)/        Dashboard, projects, settings
  api/          Route handlers (publish, upload, auth, cron)
components/
  ui/           shadcn primitives
  projects/     Content plan calendar
  dashboard/    Today's feed
lib/            Clients (supabase, gemini, tiktok, linkedin, r2)
docs/           PRD and setup docs
workflows/      Automation SOPs (WAT framework)
proxy.ts        Next.js auth middleware
```

## Documentation

| File | What it is |
|---|---|
| [`FIRST_READ_THIS.md`](./FIRST_READ_THIS.md) | **Start here** — full context, gotchas, troubleshooting |
| [`docs/PRD.md`](./docs/PRD.md) | Full product spec and database schema |
| [`summary.md`](./summary.md) | Current status and infrastructure details |
| [`CLAUDE.md`](./CLAUDE.md) | AI agent operating instructions (WAT framework) |
| [`workflows/`](./workflows/) | Markdown SOPs for each automation |
| [`docs/SETUP_SUPABASE.md`](./docs/SETUP_SUPABASE.md) | Self-hosted Supabase recovery procedures |
