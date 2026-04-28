# Social Media Posting Planner — Project Plan

## What We're Building

A **private web application** for event managers to plan, generate, and publish social media content across multiple platforms. The app manages multiple events as separate "projects," uses Gemini AI to read event documents and generate content, and directly publishes to Facebook, Instagram, TikTok, and LinkedIn.

Two core sections:
1. **Planning** — Upload event info → AI generates a full content calendar with captions, hashtags, and media specs → User reviews and edits everything
2. **Execution** — Daily email reminders → User opens the app → Uploads media → App publishes to social platforms → Tracks status

---

## Tech Stack Decision

### What We Already Have (Reuse)
| Resource | Used For |
|---|---|
| Supabase (supabase.okare.tr) | Database + User Authentication |
| Cloudflare R2 (media.okare.tr) | Media file storage (public URLs — required by Facebook/Instagram) |
| Gmail (okareefl@gmail.com) | Sending daily notification emails |
| Meta Graph API credentials | Publishing to Facebook + Instagram |
| TikTok developer credentials | Publishing to TikTok |
| Gemini API | Reading documents, generating captions, hashtags, media specs, schedules |
| Vercel | Hosting the web app |
| GitHub (github.com/tgurses74) | Code repository |

### What We Need to Set Up
| Resource | Purpose | Effort |
|---|---|---|
| LinkedIn Developer App | Publishing to LinkedIn Company Page | Medium — register at developers.linkedin.com, link your Company Page, request API access |
| Gmail App Password or OAuth | Sending notification emails from the app | Low — generate an App Password in Google Account settings |
| Supabase project tables | Store projects, posts, users, status | Low — I create these |
| Vercel project + environment variables | Host and deploy the app | Low — I set this up |

### New Technology Introduced (I Handle All of This)
| Technology | Why |
|---|---|
| Next.js 15 (App Router) | Web application framework — powers both the frontend and the backend API |
| shadcn/ui + Tailwind CSS | Pre-built, clean UI components for the dashboard |
| Supabase Auth | User login and team management (email + password) |
| Vercel Cron Jobs | Automated daily email trigger (no n8n needed) |
| Nodemailer | Sends emails from Gmail within the app |
| Multer / Vercel Blob (temp) | Handles file uploads before they go to Cloudflare R2 |

---

## Architecture (Plain Language)

```
You open the app → Supabase Auth checks your login
↓
You create a project → Upload event PDFs/docs
↓
Gemini AI reads the documents → Extracts event details
↓
Gemini suggests a posting schedule → You review and edit it
↓
Gemini generates captions, hashtags, media specs for each post
↓
Plan is saved in Supabase database
↓
Every morning at 8AM → Vercel automatically triggers a function
  → That function sends you an email: "You have X posts today"
↓
You open the app → See today's posts across all projects
↓
Click a post → Modal opens → Upload your media file
  → File goes to Cloudflare R2 → Gets a public URL
↓
Click "Publish" → App calls the social media platform API
  → Meta API for Facebook/Instagram
  → TikTok API for TikTok
  → LinkedIn API for LinkedIn
↓
Status updates: Pending → Media Ready → Publishing → Published (or Failed)
```

---

## Section 1: Planning Features (Detailed)

### Project Creation
- Project name (e.g., "Istanbul Design Festival 2026")
- Event name and date
- Caption language: English or Turkish (chosen once per project)
- Posting platforms: checkboxes for Facebook, Instagram, LinkedIn, TikTok
- Posting timeframe: start date and end date (e.g., today → event day)

### Document Upload & AI Reading
- Supported formats: PDF, JPG, PNG, DOCX (Word), XLSX (Excel), PPTX (PowerPoint), TXT
- Gemini reads the file and extracts: event name, description, key dates, speakers/artists, location, themes, target audience
- User can review and correct extracted info before generating the plan

### AI-Generated Content Plan
Gemini produces a day-by-day posting schedule. For each post:
1. **Date** — when to post
2. **Platform** — which social media channel
3. **Post type** — e.g., Story, Reel, Static Post, Carousel, Video
4. **Caption** — full AI-written caption (in selected language)
5. **Hashtags** — relevant hashtags (in selected language)
6. **Media spec** — exact technical requirements (e.g., "Vertical video, 9:16 ratio, 1080×1920px, max 15 seconds, max 50MB")
7. **Status** — starts as "Pending"

### Editing the Plan
- Inline editable table/calendar view
- Change date of any post (drag or date picker)
- Edit caption directly in the table
- Edit hashtags
- Cancel/delete a post
- Add a new post manually
- "Regenerate" a single post's caption or hashtags with AI

---

## Section 2: Daily Execution Features (Detailed)

### Daily Email Notification
- Vercel Cron Job triggers every morning (configurable time, default 8:00 AM)
- Email goes to a user-specified address (set in project or user settings)
- Email lists: project name, number of posts scheduled today, a direct link to the app

### Daily Dashboard View
- Default view when opening the app: "Today's Posts" across all projects
- Posts grouped by project or platform
- Each post shows: platform icon, post type, time, project name, status badge

### Publishing Modal
When user clicks a post:
- Shows full caption (editable one last time)
- Shows hashtags (editable)
- Shows media spec (exact requirements)
- Upload button → opens file picker
- File uploads to Cloudflare R2 → shows preview
- "Publish Now" button → sends to the platform
- Loading state while publishing
- Success or error message

### Status System
| Status | Meaning |
|---|---|
| Draft | Plan created, not yet ready |
| Pending | Scheduled, waiting for media upload |
| Media Ready | Media uploaded, ready to publish |
| Publishing | Currently being sent to the platform |
| Published | Successfully posted |
| Failed | Error occurred — shows error message + retry button |

---

## Database Design (Supabase Tables)

### `projects`
Stores one row per event. Fields: id, user_id, project_name, event_name, event_date, description, selected_platforms, language (EN/TR), timeframe_start, timeframe_end, notification_email, status, created_at

### `posts`
Stores one row per scheduled post. Fields: id, project_id, scheduled_date, platform, post_type, caption, hashtags, media_spec (JSON), media_url, status, published_at, error_message, created_at

### `event_documents`
Stores uploaded document metadata. Fields: id, project_id, filename, file_url, extracted_content (JSON), created_at

### `profiles`
Extends Supabase Auth user. Fields: id (matches auth user), full_name, role (admin/member), created_at

---

## Authentication & User Roles

- **Login**: Email + password via Supabase Auth
- **Roles**: Admin (can create projects, manage team) and Member (can view and execute daily posts)
- **Future scaling**: The architecture supports adding organization-level multi-tenancy for bigger clients later — rows in all tables will have an `org_id` column from day one

---

## LinkedIn Setup (Action Required by You)

Before LinkedIn publishing can work, you need to do this once:
1. Go to https://www.linkedin.com/developers/
2. Create a new App linked to your Company Page
3. Request these two products: "Share on LinkedIn" and "Marketing Developer Platform"
4. LinkedIn reviews this — takes 1-5 business days
5. Once approved, you get a Client ID and Client Secret
6. I will guide you through the OAuth flow to get an access token

---

## Credentials You Will Need to Provide (I Will Never Expose These)

When we set up the `.env` file, you will need to paste in the following. All of these are found in your existing accounts:

| Variable | Where to Find It |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API |
| `GEMINI_API_KEY` | Google AI Studio → API Keys |
| `R2_ACCOUNT_ID` | Cloudflare dashboard → R2 → Account details |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 → Manage API Tokens |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 → Manage API Tokens |
| `META_APP_ID` | Meta for Developers → Your App |
| `META_APP_SECRET` | Meta for Developers → Your App → Settings |
| `META_PAGE_ACCESS_TOKEN` | Meta Graph API Explorer → generate for your Page |
| `TIKTOK_CLIENT_KEY` | TikTok Developer Portal → Your App |
| `TIKTOK_CLIENT_SECRET` | TikTok Developer Portal → Your App |
| `LINKEDIN_CLIENT_ID` | LinkedIn Developer Portal → Your App (after setup) |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn Developer Portal → Your App (after setup) |
| `GMAIL_USER` | okareefl@gmail.com |
| `GMAIL_APP_PASSWORD` | Google Account → Security → 2-Step Verification → App Passwords |

---

## Development Phases

### Phase 1 — Project Scaffold & Auth ✅ DONE
- Git repo, Next.js app, shadcn/ui, Supabase Auth
- PRD, `.env.example`, workflows, sidebar layout

### Phase 2 — Project Management ✅ DONE
- Projects CRUD, document upload → Cloudflare R2
- Gemini extraction of event info

### Phase 3 — AI Content Generation ✅ DONE
- Gemini generates full posting schedule
- Editable content calendar with inline editing

### Phase 4 — Media & Publishing ✅ DONE
- Today dashboard, publish modal, media upload
- Facebook, Instagram, TikTok, LinkedIn publishing
- Presigned URLs for video uploads (bypasses Vercel 4.5 MB limit)

### Phase 5 — Daily Notifications ✅ DONE
- Vercel Cron → daily email via Nodemailer + Gmail
- User settings: notification email, time, timezone

### Phase 6 — Polish & Deploy ✅ DONE
- App live at https://socialplanner.okare.tr
- All platform OAuth flows working
- Error handling, retry, status tracking

---

## First Action: Creating the PRD File

The first deliverable when we start implementation will be a `docs/PRD.md` file inside the project — a plain-English product requirements document covering everything above, written so any developer (or future Claude session) can pick up and continue the work.

---

## Verification Checklist (After Phase 1)
- `npm run dev` → app loads at localhost:3000
- Login page appears, can create account and log in
- Supabase dashboard shows the new tables
- `.env` file is not committed to GitHub
- `git log` shows initial commit on GitHub