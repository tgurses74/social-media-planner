# Tools

Scripts that do deterministic work alongside the web app — one-off migrations, local data processing, or maintenance tasks.

The web app itself handles all production flows through Next.js Route Handlers and Server Actions. Tools here are for *developer-side* tasks where a standalone script is easier than running through the app.

## Conventions
- Python scripts go directly in this folder (e.g., `backfill_media_specs.py`)
- TypeScript scripts go in `tools/ts/` and run with `npx tsx`
- All scripts load `.env.local` (via `python-dotenv` or `dotenv/config`) — never hardcode secrets
- Each script should have a docstring / top comment explaining purpose, inputs, and safe-to-rerun behavior

## Setup (Python)
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r tools/requirements.txt
```

## Current tools
None yet — added as needed during development.
