# Workflow: Publish Post

## Objective
Push a single post (with media already uploaded to Cloudflare R2) to the correct social media platform and update its status.

## Inputs
- `post_id` — the post being published; must be owned by the authenticated user

## Steps
1. Load post and verify `status = 'media_ready'` and `media_url` is a valid R2 URL.
2. Update status to `publishing`.
3. Route to the platform-specific handler:
   - **Facebook / Instagram**: Meta Graph API
     - Upload creative via `/{page-id}/photos` or `/{ig-user-id}/media` with `image_url` pointing at R2
     - Publish via `/{ig-user-id}/media_publish` or the photo's direct publish endpoint
   - **TikTok**: TikTok Content Posting API
     - Initialize upload, provide R2 URL, wait for processing, then publish
   - **LinkedIn**: LinkedIn Share API
     - Register the media asset, reference R2 URL, create a `posts` payload with author URN = Company Page URN
4. On success:
   - Update post: `status = 'published'`, `platform_post_id = <returned id>`, `published_at = now()`
5. On failure:
   - Update post: `status = 'failed'`, `error_message = <reason>`
   - Return structured error to the client

## Outputs
- Live social media post on the target platform
- Updated `posts` row with status, `platform_post_id`, and timestamps

## Edge cases
- **R2 URL not publicly reachable**: Meta will reject. Verify bucket public access before first launch.
- **Token expired**: Meta Page tokens are long-lived but can be revoked. LinkedIn tokens expire after 60 days — refresh via OAuth.
- **Media format mismatch**: validate media against `media_spec` on the client before marking `media_ready`. If validation slips through, platform returns a descriptive error — surface it as `error_message`.
- **Platform rate limits**: catch 429 responses, delay and retry once. If repeated, surface to user.
- **Double publish**: if user clicks "Publish" twice, the `publishing` status gate prevents duplicate API calls (check before setting `publishing`).
