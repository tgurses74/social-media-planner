# Social Media Posting Planner

A Next.js 16 web app that helps event managers plan and publish social media content across Facebook, Instagram, LinkedIn, and TikTok using AI.

See [`docs/PRD.md`](./docs/PRD.md) for the full product spec.

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

## Stack
- **Next.js 16** (App Router) + TypeScript + Tailwind v4 + shadcn/ui
- **Supabase** — auth + Postgres (self-hosted at `supabase.okare.tr`)
- **Cloudflare R2** — media storage (`media.okare.tr`)
- **Google Gemini** — document reading and content generation
- **Vercel Cron** — daily notification scheduling
- **Nodemailer** — email via Gmail App Password

## Project structure
```
app/            Next.js routes
  (auth)/       Login, signup, auth callback
  (app)/        Authenticated app (dashboard, projects, settings)
  api/          Route Handlers
components/     React components
  ui/           shadcn primitives
lib/            Clients, utilities
  supabase/     Browser + server Supabase clients
docs/           PRD and architecture docs
workflows/      Markdown SOPs (WAT framework)
tools/          Dev-side scripts (Python / TS)
proxy.ts        Next.js 16 auth middleware
```

## Documentation
- [Product spec (PRD)](./docs/PRD.md)
- [Agent instructions (WAT framework)](./CLAUDE.md)
- [Technical infrastructure notes](./Technical%20Information%20That%20I%20have.md)
- [Workflows](./workflows/README.md)
