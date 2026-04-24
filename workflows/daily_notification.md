# Workflow: Daily Notification

## Objective
Every morning, send each user an email summarising today's scheduled posts across all their active projects, with a direct link into the app.

## Inputs
- None (runs on schedule). Reads all users with `profiles.notification_email` set.

## Steps
1. Vercel Cron triggers `/api/cron/daily-notification` at the user's configured time (default 08:00 Europe/Istanbul).
2. Query Supabase for distinct `user_id` values with at least one post where `scheduled_date = today` and `status IN ('pending', 'media_ready')`.
3. For each user:
   - Fetch their `profile` (notification_email, timezone, name).
   - Fetch today's posts grouped by project.
   - Build HTML email: greeting, bullet list of posts per project, CTA button linking to `/dashboard`.
   - Send via Nodemailer using Gmail App Password.
4. Log send result per user. On failure, retry once.

## Outputs
- Email delivered to user's `notification_email`.
- Row in (future) `notification_log` table.

## Edge cases
- **No posts today for a user**: skip (don't send empty emails).
- **User has no `notification_email` set**: skip and log.
- **Gmail sending quota hit (500/day)**: consider switching to a transactional provider (Resend, Postmark) if volume grows.
- **Cron timing across timezones**: for v1 use one global trigger at 08:00 Europe/Istanbul; revisit when international users onboard.
