# Workflows

Markdown SOPs that describe *what to do* and *how* for each major automation in this project.

Each workflow file defines:
- **Objective** — what this workflow accomplishes
- **Inputs** — required parameters, credentials, or files
- **Steps** — ordered actions and which tools/scripts/APIs to call
- **Outputs** — what is produced and where it lives
- **Edge cases** — known failure modes and how to handle them

## Current workflows

| File | Covers |
|---|---|
| `project_intake.md` | Create a new project, upload event docs, extract info via Gemini |
| `content_plan_generation.md` | Generate the full posting schedule with captions, hashtags, media specs |
| `daily_notification.md` | Daily cron → email digest of today's posts |
| `publish_post.md` | Publish a post to Meta / TikTok / LinkedIn with verification |

Workflows evolve as the system learns. If a tool's behavior changes (rate limits, auth quirks, undocumented constraints), update the workflow so the next run benefits from the learning.
