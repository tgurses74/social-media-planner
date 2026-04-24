# Workflow: Project Intake

## Objective
Take a user's event description (uploaded as one or more documents) and turn it into a structured `project` row with extracted metadata, ready for content plan generation.

## Inputs
- `user_id` — authenticated Supabase user
- `project_name` — short name for internal reference
- `event_name`, `event_date` — core identity of the event
- `language` — `en` or `tr`
- `platforms[]` — subset of `facebook`, `instagram`, `linkedin`, `tiktok`
- `timeframe_start`, `timeframe_end` — posting window
- `documents[]` — files (PDF, JPG, PNG, DOCX, XLSX, PPTX, TXT)

## Steps
1. Upload each document to Cloudflare R2 bucket `openborders-media` under `projects/{project_id}/docs/`.
2. Insert row into `event_documents` with file URL and metadata.
3. For each document, call Gemini multimodal API with a prompt asking for structured extraction:
   - Key dates and milestones
   - Speakers / performers / guests
   - Location, capacity, ticket info
   - Themes, tone, target audience
   - Sponsors / partners
4. Store the extraction in `event_documents.extracted_content` (JSONB).
5. Merge all document extractions into a single summary, shown to the user for review.
6. On user confirmation, insert the `projects` row with final details.

## Outputs
- A row in `projects`
- One or more rows in `event_documents` with `extracted_content`
- Files in Cloudflare R2 at `projects/{project_id}/docs/`

## Edge cases
- **Unsupported format**: reject client-side before upload; show supported list.
- **Gemini extraction failure or timeout**: keep document uploaded, mark extraction as failed, allow manual text entry.
- **DOCX/XLSX/PPTX not natively read by Gemini**: pre-convert to PDF or parse text with `mammoth`/`xlsx`/`pptx-parser` before sending to Gemini.
- **File too large for R2 free tier**: currently unlimited within R2 bucket limits; add size validation at 100MB per file.
