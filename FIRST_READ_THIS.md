# FIRST_READ_THIS.md — Social Media Posting Planner

> **Read this before touching any code.** This file exists so any developer or AI agent can understand the full context, avoid known pitfalls, and build confidently without repeating mistakes.

---

## 1. What This Project Is

A **private, multi-tenant web application** for event managers. It replaces hours of manual social media planning with a two-step workflow:

1. **Plan** — Upload an event brief (PDF, DOCX, image, etc.). Gemini AI reads it and generates a complete social media posting calendar with captions, hashtags, and media specs across Facebook, Instagram, LinkedIn, and TikTok.
2. **Execute** — Each morning a notification email arrives listing today's posts. The user opens the app, uploads media, and publishes directly to the platforms with one click.

**Live URL:** `https://socialplanner.okare.tr`
**GitHub:** `https://github.com/tgurses74/social-media-planner` (public)
**Vercel project:** `socialplanner` · team `okareefls-projects`
**Owner:** okareefl@gmail.com

---

## 2. What the App Does — Step-by-Step Workflow

```
USER OPENS APP
└─ Supabase Auth validates session (cookie-based JWT)

CREATE PROJECT
└─ User fills: project name, event name, event date, description, language (EN/TR),
   platforms (FB/IG/TT/LI), posting timeframe start → end

UPLOAD EVENT DOCUMENTS
└─ User drags PDFs, DOCX, images
└─ /api/upload-and-extract → Cloudflare R2 (stored at media.okare.tr)
   → Gemini multimodal reads the file
   → Extracts: event details, key dates, audience, themes
   → Saves as JSON to event_documents.extracted_content

GENERATE CONTENT PLAN
└─ /api/projects/[id]/generate-plan
   → Gemini generates N posts covering the timeframe
   → Each post: date, platform, post_type, caption, hashtags, media_spec
   → Saved to posts table with status = 'draft'
   → User reviews and edits inline (caption, hashtags, date)

DAILY CYCLE (Vercel Cron, 08:00 Istanbul)
└─ /api/cron/daily-notification
   → Queries posts WHERE scheduled_date = today AND status IN (pending, media_ready)
   → Groups by project, sends email digest via Nodemailer + Gmail

USER EXECUTES TODAY'S POSTS
└─ Opens Today dashboard
└─ Clicks post → Edit/Publish modal
└─ Uploads media:
   · Images → /api/upload-media → Vercel proxy → R2 (≤4.5 MB limit OK)
   · Videos → /api/upload-media/presign → gets signed PUT URL → browser PUTs directly to R2
└─ Status: draft → pending → media_ready

PUBLISH
└─ Facebook  → /api/publish/meta  (Meta Graph API v25.0, PAGE_ID)
└─ Instagram → /api/publish/meta  (Meta Graph API v25.0, IG_ID — container polling required)
└─ TikTok    → /api/publish/tiktok (TikTok Content Posting API, OAuth token from oauth_tokens)
└─ LinkedIn  → /api/publish/linkedin (LinkedIn Share API, OAuth token from oauth_tokens)
└─ On success: status = 'published', platform_post_id, published_at stored
└─ On failure: status = 'failed', error_message stored, retry allowed
```

---

## 3. Tech Stack

| Layer | Technology | Where It Runs |
|---|---|---|
| Web app | Next.js 16 (App Router) + TypeScript | Vercel |
| UI | Tailwind CSS v4 + shadcn/ui | Vercel |
| Auth | Supabase Auth (email + password) | Oracle VPS → Cloudflare Tunnel |
| Database | Supabase PostgreSQL | Oracle VPS → Cloudflare Tunnel |
| Media storage | Cloudflare R2 (S3-compatible) | Cloudflare edge (`media.okare.tr`) |
| AI | Google Gemini API (gemini-1.5-flash) | Google |
| Email | Nodemailer + Gmail App Password | Vercel serverless |
| Scheduling | Vercel Cron Jobs | Vercel |
| Facebook/Instagram | Meta Graph API v25.0 | Meta |
| TikTok | TikTok Content Posting API | TikTok |
| LinkedIn | LinkedIn Share API + OAuth 2.0 | LinkedIn |

---

## 4. Infrastructure Architecture

```
                    ┌─────────────────────────┐
                    │       User's browser     │
                    └────────────┬────────────┘
                                 │ HTTPS
                    ┌────────────▼────────────┐
                    │   Vercel (socialplanner) │
                    │   socialplanner.okare.tr │
                    │   Next.js 16 App Router  │
                    └──┬──────────┬───────────┘
                       │          │
          ┌────────────▼──┐  ┌───▼──────────────────┐
          │  Supabase      │  │  External APIs        │
          │  Auth + DB     │  │  · Meta Graph API     │
          │  supabase-     │  │  · TikTok API         │
          │  social.okare  │  │  · LinkedIn API       │
          │  .tr           │  │  · Gemini API         │
          │                │  └───────────────────────┘
          │  Cloudflare    │
          │  Tunnel        │         ┌────────────────┐
          │       ↓        │         │ Cloudflare R2  │
          │  Oracle Cloud  │         │ media.okare.tr │
          │  VPS           │         │ (public media) │
          └────────────────┘         └────────────────┘
```

**Supabase** runs as Docker Compose on an Oracle Cloud VPS (IP: 140.245.209.173).
It is NOT exposed directly — traffic goes through a **Cloudflare Tunnel** (`okare-n8n-tunnel`).
The public hostname is `supabase-social.okare.tr`.

---

## 5. Critical Technical Warnings ⚠️

These are hard-won lessons. Ignore them and you will spend hours debugging.

### 5.1 ALWAYS use `getSession()`, NEVER `getUser()` in server code

```typescript
// ✅ CORRECT — reads JWT from cookie, no network call
const { data: { session } } = await supabase.auth.getSession();
const user = session?.user ?? null;

// ❌ WRONG — makes HTTP call to Supabase Auth server
const { data: { user } } = await supabase.auth.getUser();
```

**Why:** `getUser()` makes a server-to-server HTTP call from Vercel to `supabase-social.okare.tr`. Cloudflare occasionally classifies this as bot traffic and blocks it, returning a Cloudflare HTML challenge page instead of a JSON response. This causes `getUser()` to return `null` even when the user is logged in, resulting in 401 errors on every API route. `getSession()` reads the JWT locally from the cookie with no network call.

### 5.2 Cloudflare Bot Fight Mode must be OFF for `okare.tr`

**Location:** Cloudflare Dashboard → `okare.tr` zone → Security → Bots → Bot Fight Mode → OFF

**Why:** Vercel serverless functions have Cloudflare IP ranges. When they call `supabase-social.okare.tr`, Cloudflare's Bot Fight Mode sees server-to-server traffic and serves a JS challenge. The serverless function receives HTML instead of JSON, breaking all database queries.

**Alternative (more surgical):** Create a WAF custom rule in Cloudflare to bypass bot checks for requests to `supabase-social.okare.tr` from Vercel IP ranges. But the simplest fix is Bot Fight Mode OFF.

### 5.3 Instagram media containers MUST be polled before publishing

```typescript
// ✅ CORRECT — poll for all container types (images too)
const container = await graphPost(`${IG_ID}/media`, containerBody);
await waitForIgContainer(container.id); // always, not just for video
const published = await graphPost(`${IG_ID}/media_publish`, { creation_id: container.id });

// ❌ WRONG — skipping poll for images
const container = await graphPost(`${IG_ID}/media`, containerBody);
const published = await graphPost(`${IG_ID}/media_publish`, { creation_id: container.id });
// ^ causes error 9007 "Media ID is not available"
```

**Why:** Instagram processes ALL media containers asynchronously, including images. Calling `media_publish` on a container that is still `IN_PROGRESS` returns error code 9007. The fix is to always poll `status_code` until `FINISHED` before publishing.

### 5.4 Vercel serverless has a hard 4.5 MB request body limit

Video files easily exceed 4.5 MB. Uploading videos through `/api/upload-media` (which proxies through Vercel) returns a plain-text `"Request Entity Too Large"` response that the frontend tries to parse as JSON and crashes.

**Fix already implemented:** Videos use presigned PUT URLs:
1. Frontend calls `/api/upload-media/presign` (tiny request: just filename + contentType)
2. Gets back a short-lived signed PUT URL for R2
3. Browser PUTs the video file directly to R2 (bypasses Vercel entirely)
4. Images still use the proxy approach (they're small enough)

**R2 CORS required:** For presigned uploads to work, the R2 bucket must allow `PUT` from the app's origin. Configure in Cloudflare → R2 → bucket → Settings → CORS:
```json
[{
  "AllowedOrigins": ["https://socialplanner.okare.tr"],
  "AllowedMethods": ["PUT", "GET"],
  "AllowedHeaders": ["Content-Type"],
  "MaxAgeSeconds": 3600
}]
```

### 5.5 Meta credentials: System User token, not Page Access Token

`META_PAGE_ACCESS_TOKEN` is a **System User token** from Meta Business Manager (permanent, does not expire). It is NOT the short-lived token from Graph API Explorer. The variable name is misleading — it's a System User bearer token that works for both Page and Instagram calls.

**Required System User permissions:**
- `pages_manage_posts`
- `pages_read_engagement`
- `instagram_content_publish`
- `instagram_basic`

### 5.6 TikTok OAuth uses cookie-based CSRF state

The TikTok OAuth initiation flow stores `{ state, returnTo }` as a JSON cookie named `tt_oauth`. The callback route reads this cookie to validate the `state` parameter (CSRF protection). If cookies are blocked or the cookie expires before the user completes OAuth, the callback returns `tiktok_auth_failed`.

### 5.7 LinkedIn redirect_uri must be registered in the Developer Portal

The production callback URL `https://socialplanner.okare.tr/api/auth/linkedin/callback` must be explicitly listed in the LinkedIn Developer Portal under your app's Authorized Redirect URLs. LinkedIn returns a `redirect_uri_mismatch` error if it's not registered — even localhost works fine during dev but production fails.

**LinkedIn Developer Portal:** https://www.linkedin.com/developers/apps → your app → Auth → Authorized redirect URLs

### 5.8 Supabase admin client bypasses RLS — use carefully

Several routes use a service-role Supabase client (`createAdminClient`) that bypasses Row Level Security. This is intentional for specific operations (e.g., TikTok callback upsert to `oauth_tokens`). Only use it after verifying user identity through the session. Never expose it to the client.

---

## 6. Environment Variables Reference

All secrets live in Vercel → Project Settings → Environment Variables. Never commit them.

| Variable | Purpose | Where to get |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://supabase-social.okare.tr` | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | Supabase dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS (server only) | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_APP_URL` | `https://socialplanner.okare.tr` | Your Vercel domain |
| `GEMINI_API_KEY` | Google Gemini | https://aistudio.google.com/apikey |
| `R2_ACCOUNT_ID` | Cloudflare account ID | Cloudflare dashboard → R2 |
| `R2_ACCESS_KEY_ID` | R2 S3 access key | Cloudflare → R2 → Manage API Tokens |
| `R2_SECRET_ACCESS_KEY` | R2 S3 secret | Cloudflare → R2 → Manage API Tokens |
| `R2_BUCKET_NAME` | `openborders-media` | Your R2 bucket name |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | `https://media.okare.tr` | Your R2 custom domain |
| `META_PAGE_ACCESS_TOKEN` | System User bearer token | Meta Business Manager → System Users |
| `META_PAGE_ID` | Facebook Page ID (`906298612797307`) | Meta Business Suite |
| `META_INSTAGRAM_ACCOUNT_ID` | Instagram Business Account ID (`17841405392091501`) | Meta Business Suite |
| `TIKTOK_CLIENT_KEY` | TikTok app client key | TikTok Developer Portal |
| `TIKTOK_CLIENT_SECRET` | TikTok app client secret | TikTok Developer Portal |
| `LINKEDIN_CLIENT_ID` | LinkedIn app client ID (`77gt2kxophkfcl`) | LinkedIn Developer Portal |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn app client secret | LinkedIn Developer Portal |
| `GMAIL_USER` | `okareefl@gmail.com` | Your Gmail |
| `GMAIL_APP_PASSWORD` | Gmail App Password | Google Account → Security → App Passwords |
| `CRON_SECRET` | Protects the cron endpoint | Generate a random string |

---

## 7. Database Schema (Key Tables)

```sql
profiles          -- extends auth.users: full_name, role, notification_email, timezone
projects          -- one row per event: name, event_date, platforms[], timeframe, language, status
event_documents   -- uploaded files: file_url (R2), extracted_content (Gemini JSON)
posts             -- scheduled posts: platform, post_type, caption, hashtags, media_spec,
                  --   media_url, status, platform_post_id, published_at, error_message
oauth_tokens      -- TikTok + LinkedIn tokens: platform, access_token, refresh_token,
                  --   expires_at, platform_user_id, platform_user_name
```

**RLS (Row Level Security) is enabled.** Users can only see rows where `user_id = auth.uid()` or via the projects join. API routes that need to bypass RLS (e.g., OAuth callbacks writing tokens) use the admin client with `SUPABASE_SERVICE_ROLE_KEY`.

---

## 8. Key Source Files

| File | What it does |
|---|---|
| `proxy.ts` | Next.js middleware — auth gate, redirects `/` to `/dashboard` or `/login` |
| `lib/supabase/server.ts` | Server-side Supabase client (reads cookies) |
| `lib/supabase/client.ts` | Browser Supabase client |
| `lib/gemini.ts` | Gemini API: document extraction + content plan generation |
| `lib/tiktok.ts` | TikTok API: publish post, get user info |
| `lib/linkedin.ts` | LinkedIn API: publish post, token exchange |
| `lib/r2.ts` | Cloudflare R2: upload buffer, generate presigned PUT URL |
| `app/api/publish/meta/route.ts` | Facebook + Instagram publishing (Meta Graph API) |
| `app/api/publish/tiktok/route.ts` | TikTok publishing |
| `app/api/publish/linkedin/route.ts` | LinkedIn publishing |
| `app/api/upload-media/route.ts` | Image upload proxy → R2 |
| `app/api/upload-media/presign/route.ts` | Presigned URL for direct video → R2 upload |
| `app/api/upload-and-extract/route.ts` | Event document upload → R2 → Gemini extraction |
| `app/api/projects/[id]/generate-plan/route.ts` | Trigger Gemini content plan generation |
| `app/api/auth/tiktok/callback/route.ts` | TikTok OAuth callback |
| `app/api/auth/linkedin/callback/route.ts` | LinkedIn OAuth callback |
| `app/api/cron/daily-notification/route.ts` | Vercel Cron handler for daily emails |
| `components/projects/content-plan.tsx` | Main editable content calendar UI |
| `components/dashboard/today-feed.tsx` | Today's posts dashboard with publish modal |

---

## 9. Troubleshooting

### "Unauthorized" / 401 on all API routes
**Cause:** Using `getUser()` instead of `getSession()`, or Cloudflare Bot Fight Mode is ON.
**Fix:** Replace every `supabase.auth.getUser()` with `supabase.auth.getSession()` in server code. Confirm Bot Fight Mode is OFF in Cloudflare → `okare.tr` → Security → Bots.

### Supabase returns Cloudflare HTML instead of JSON
**Cause:** Bot Fight Mode is ON for `okare.tr`.
**Fix:** Cloudflare → okare.tr → Security → Bots → Bot Fight Mode → **OFF**.

### Instagram publish fails with "Media ID is not available (code 9007)"
**Cause:** `media_publish` called before the container reached `FINISHED` status.
**Fix:** Always poll `waitForIgContainer(container.id)` before calling `media_publish`, for ALL container types (not just video). See `app/api/publish/meta/route.ts`.

### Video upload fails with "Request Entity Too Large" or JSON parse error
**Cause:** Video exceeds Vercel's 4.5 MB serverless request body limit.
**Fix:** Use presigned URL flow: frontend calls `/api/upload-media/presign`, then PUTs directly to R2. Ensure R2 CORS allows `PUT` from the app domain.

### TikTok connect fails with "tiktok_auth_failed"
**Cause:** The `tt_oauth` cookie (CSRF state) was lost during the OAuth redirect, or state mismatch.
**Fix:** Check browser cookies. The cookie must survive the redirect to TikTok and back. Check that `NEXT_PUBLIC_APP_URL` is set correctly in Vercel env vars.

### LinkedIn connect fails with "redirect_uri_mismatch"
**Cause:** The production callback URL is not in the LinkedIn app's authorized redirect list.
**Fix:** LinkedIn Developer Portal → your app → Auth → add `https://socialplanner.okare.tr/api/auth/linkedin/callback`.

### Supabase auth completely broken after Docker volume wipe (`docker compose down -v`)
**Cause:** A full volume wipe destroys the `_supabase.sql` bootstrap data and Realtime schema.
**Fix:** Three manual recovery steps — see `docs/SETUP_SUPABASE.md` for the exact commands.

### Media URL is accessible (200) but Meta rejects the post
**Cause:** File format not supported by Instagram (e.g. WebP, GIF) or aspect ratio out of range.
**Instagram image requirements:** JPEG or PNG, aspect ratio 4:5 to 1.91:1, max 8 MB.
**Instagram reel requirements:** MP4/MOV, H.264, max 1 GB, 3s–90s duration.

### TikTok token expired error
**Cause:** TikTok access tokens expire. The app checks `expires_at` before publishing.
**Fix:** User must reconnect TikTok in Settings. The `oauth_tokens` row will be refreshed.

### Daily cron email not arriving
**Cause:** `CRON_SECRET` mismatch, Gmail App Password wrong, or no posts scheduled for today.
**Fix:** Verify `CRON_SECRET` in Vercel matches the cron endpoint header. Test Gmail credentials with `GMAIL_USER` + `GMAIL_APP_PASSWORD` (not the main Gmail password — must be an App Password).

---

## 10. Documentation Reading Order

Read these files in order if you're picking up this project cold:

| Order | File | Why |
|---|---|---|
| 1 | `FIRST_READ_THIS.md` (this file) | Big picture, gotchas, workflow |
| 2 | `docs/PRD.md` | Full product spec, database schema, feature details |
| 3 | `summary.md` | Current implementation status |
| 4 | `CLAUDE.md` | How the AI agent should operate (WAT framework) |
| 5 | `workflows/README.md` | Overview of all automation SOPs |
| 6 | `workflows/publish_post.md` | Publishing flow in detail |
| 7 | `workflows/content_plan_generation.md` | AI generation flow |
| 8 | `docs/SETUP_SUPABASE.md` | Only needed if re-setting up the Supabase instance |

---

## 11. Development Setup (Local)

```bash
git clone https://github.com/tgurses74/social-media-planner.git
cd social-media-planner
npm install
cp .env.example .env.local   # fill in all values (see Section 6 above)
npm run dev                  # http://localhost:3000
```

**Note:** `npm run build` runs TypeScript type-check + Vite build. Fix all TS errors before pushing — Vercel will reject a build with type errors.

**Local Supabase:** The app points to the production Supabase instance at `supabase-social.okare.tr` even in local dev (no local Supabase instance). Be careful with data during local testing.

---

## 12. Deployment

Deployment is fully automated via GitHub → Vercel:
- Push to `main` → Vercel builds and deploys automatically
- Vercel project: `socialplanner`, team: `okareefls-projects`
- Node.js version: 24.x, bundler: Turbopack

**To trigger a manual redeploy** (e.g. after changing env vars):
```bash
vercel --prod
# or just make an empty commit:
git commit --allow-empty -m "trigger: redeploy" && git push
```

**Env var changes:** Adding/changing env vars in Vercel dashboard does NOT auto-redeploy. You must trigger a new deployment after changing secrets.
