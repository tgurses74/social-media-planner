# Workflow: Content Plan Generation

## Objective
Given a project with extracted event info, generate a complete, editable social media posting schedule covering the timeframe from `timeframe_start` to `timeframe_end`.

## Inputs
- `project_id` (and everything reachable from it: event info, platforms, language, extracted docs)

## Steps
1. Fetch project + merged document extractions.
2. Call Gemini with a prompt that specifies:
   - Number of days in the timeframe
   - Selected platforms
   - Language (`en` or `tr`)
   - Per-platform best practices (post frequency, post types, ideal media)
   - Event context (name, date, themes, audience)
3. Gemini returns a structured JSON array of posts. Each post includes:
   - `scheduled_date`
   - `platform`
   - `post_type` (story/reel/post/carousel/video/short — platform-appropriate)
   - `caption` (language-appropriate)
   - `hashtags` (language-appropriate)
   - `media_spec` object: `{ type, orientation, aspect_ratio, min_resolution, max_size_mb, max_duration_sec }`
4. Validate the structure server-side (all required fields present, valid enums).
5. Bulk insert into `posts` table with `status = 'pending'`.
6. Redirect user to editable calendar view.

## Outputs
- Rows in `posts` for every planned post across the timeframe.

## Edge cases
- **Gemini returns malformed JSON**: retry with stricter prompt (JSON schema example). If retry fails, fall back to a template-based schedule.
- **Timeframe too long (>365 days)**: cap at 365 days and warn user.
- **Timeframe too short (0 or negative days)**: validate before calling AI.
- **Token limit exceeded**: if project has many documents, summarize extractions first in a pre-pass.
- **Duplicate posts on same day/platform/type**: let Gemini's output stand — user can edit or remove in the calendar view.
