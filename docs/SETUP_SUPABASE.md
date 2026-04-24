# Supabase Setup — Social Media Planner

**STATUS: COMPLETE** — Instance running at `https://supabase-social.okare.tr` (Oracle Cloud VPS 140.245.209.173, Cloudflare Tunnel `okare-n8n-tunnel`).

---

## Lessons learned (issues hit during setup)

1. **Missing .env variables** — The default `.env.example` was missing newer required vars. Had to add: `SECRET_KEY_BASE`, `VAULT_ENC_KEY`, `PG_META_CRYPTO_KEY`, `LOGFLARE_*`, `POOLER_*`, `ENABLE_ANONYMOUS_USERS`, `IMGPROXY_AUTO_WEBP`, storage stubs.
2. **`_supabase` database not created** — DB init scripts don't re-run after first init. Fix: `docker cp + psql` to run `volumes/db/_supabase.sql` manually.
3. **Auth function ownership error** — `auth.uid()` etc. owned by `supabase_admin` but auth container runs as `supabase_auth_admin`. Fix: PL/pgSQL loop reassigning all `auth` schema functions to `supabase_auth_admin`.
4. **Realtime schema missing** — Manually ran `volumes/db/realtime.sql` via `docker cp + psql`.
5. **Email autoconfirm not working** — `docker compose restart` does NOT re-read `.env` changes. Must use `docker compose up -d --force-recreate auth`. Variable name is `ENABLE_EMAIL_AUTOCONFIRM=true` (maps to `GOTRUE_MAILER_AUTOCONFIRM` in docker-compose.yml line 166).
6. **CORS** — Set `SITE_URL=http://localhost:3000` and `ADDITIONAL_REDIRECT_URLS=http://localhost:3000/**,https://supabase-social.okare.tr/**`.

## ⚠️ After any `docker compose down -v` (full wipe), run these 3 fixes before starting:
1. `docker cp volumes/db/_supabase.sql supabase-social-db-1:/tmp/ && docker exec supabase-social-db-1 psql -U postgres -f /tmp/_supabase.sql`
2. `docker cp volumes/db/realtime.sql supabase-social-db-1:/tmp/ && docker exec supabase-social-db-1 psql -U postgres -f /tmp/realtime.sql`
3. Run the auth function ownership reassignment script (see auth fix above)

---

Goal: stand up a **second, isolated** self-hosted Supabase stack on the same Oracle Cloud VM (without disturbing the existing instance at `supabase.okare.tr`), then bring three keys back to this project's `.env.local`.

---

## Part A — Prep (on Oracle VM)

- [ ] SSH into the Oracle VM that hosts the existing Supabase
- [ ] Confirm free resources: `free -h` (aim for ≥2 GB free RAM) and `df -h` (≥10 GB free disk)
- [ ] Confirm Docker + docker-compose are installed: `docker --version && docker compose version`
- [ ] Pick a subdomain for the new instance, e.g. `supabase-social.okare.tr`
- [ ] Add a DNS **A record** for that subdomain → Oracle VM public IP (Cloudflare or your DNS provider)
- [ ] Open the needed ports in the Oracle **Security List / NSG** if not already open (80, 443)

## Part B — Create the second Supabase stack

- [ ] Create an isolated directory: `mkdir -p ~/supabase-social && cd ~/supabase-social`
- [ ] Clone Supabase docker files: `git clone --depth 1 https://github.com/supabase/supabase.git`
- [ ] Copy the docker folder out: `cp -R supabase/docker/* . && cp supabase/docker/.env.example .env`
- [ ] Remove the clone: `rm -rf supabase`
- [ ] Edit `.env` and set **unique values different from your first instance**:
  - [ ] `POSTGRES_PASSWORD` — generate a new strong password
  - [ ] `JWT_SECRET` — generate a NEW 40+ char random string (do NOT reuse the other instance's)
  - [ ] `ANON_KEY` — generate via https://supabase.com/docs/guides/self-hosting#api-keys using the new JWT_SECRET
  - [ ] `SERVICE_ROLE_KEY` — generate the same way
  - [ ] `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD` — set new admin creds
  - [ ] `SITE_URL=https://supabase-social.okare.tr`
  - [ ] `API_EXTERNAL_URL=https://supabase-social.okare.tr`
  - [ ] `SUPABASE_PUBLIC_URL=https://supabase-social.okare.tr`
- [ ] Change the **host ports** in `docker-compose.yml` so they don't collide with the first instance. The cleanest approach: bind services only to `127.0.0.1` and pick new ports (e.g. Kong on `127.0.0.1:8100:8000`, Studio on `127.0.0.1:3100:3000`). Reverse proxy will front them.
- [ ] Start the stack: `docker compose up -d`
- [ ] Verify all containers are healthy: `docker compose ps`

## Part C — Reverse proxy + TLS for the new subdomain

Mirror however your first instance is fronted (likely Nginx or Caddy):

- [ ] Add a new server block/site for `supabase-social.okare.tr` pointing to the new Kong port (e.g. `127.0.0.1:8100`)
- [ ] Issue a TLS cert for the new subdomain (Certbot or Caddy auto-TLS)
- [ ] Reload the proxy: `nginx -t && systemctl reload nginx` (or `caddy reload`)
- [ ] Test: `curl -I https://supabase-social.okare.tr` — expect `200` or `401`, not connection refused

## Part D — Verify the instance works

- [ ] Visit `https://supabase-social.okare.tr` in a browser → Supabase Studio login appears
- [ ] Log in with the new `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD`
- [ ] Go to **Project Settings → API** and confirm you can see:
  - Project URL (should be `https://supabase-social.okare.tr`)
  - `anon` `public` key
  - `service_role` `secret` key

---

## Part E — Bring three values back here

Once Part D is done, come back to this chat with these three values:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://supabase-social.okare.tr`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (the anon public key from Studio)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = (the service_role secret from Studio)

Then I'll:
1. Update `.env.local` at [`.env.local`](../.env.local) lines 6–8
2. Run the Phase 1 migrations against the new DB
3. Confirm the Next.js app can sign in

Other env vars (Gemini, R2, Meta, TikTok, LinkedIn, Gmail) stay blank for now — we'll fill them in as each feature gets built in later phases.

---

## Notes / gotchas

- **Do not reuse the JWT_SECRET** from the first instance. If you do, tokens from one app would validate against the other — a security hole.
- The new stack's Postgres is a separate database, so data is fully isolated from your other app.
- If RAM gets tight on Oracle, stop non-essential services, or consider moving this to Supabase Cloud's free tier instead.
- Back up the new `.env` file somewhere safe (password manager). Losing `JWT_SECRET` invalidates all tokens.
