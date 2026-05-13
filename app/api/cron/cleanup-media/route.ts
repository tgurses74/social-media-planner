import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { deleteFromR2 } from "@/lib/r2";

// Daily at 03:00 UTC. Deletes R2 objects for posts that were published >7 days ago.
// Vercel Cron sends Authorization: Bearer ${CRON_SECRET}.

const RETENTION_DAYS = 7;

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
  const r2Prefix = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!.replace(/\/$/, "") + "/";
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400_000).toISOString();
  const admin = adminClient();

  const { data: candidates, error: candErr } = await admin
    .from("posts")
    .select("id, media_url")
    .eq("status", "published")
    .lt("published_at", cutoff)
    .not("media_url", "is", null);

  if (candErr) {
    console.error("[cron/cleanup-media] candidate query failed:", candErr);
    return NextResponse.json({ error: candErr.message }, { status: 500 });
  }
  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ ok: true, scanned: 0, deleted: 0, dryRun });
  }

  const urls = candidates.map((c) => c.media_url).filter((u): u is string => !!u);

  // Any post that shares one of these URLs but is NOT itself eligible (draft, pending, failed,
  // or published within the retention window) must keep its R2 file. With random-UUID keys this
  // set is empty in practice, but the check is cheap and guards against future schema changes.
  const { data: stillNeeded } = await admin
    .from("posts")
    .select("media_url, status, published_at")
    .in("media_url", urls);
  const protectedUrls = new Set(
    (stillNeeded ?? [])
      .filter((p) => p.status !== "published" || !p.published_at || p.published_at >= cutoff)
      .map((p) => p.media_url),
  );

  let deleted = 0;
  let skipped = 0;
  let failed = 0;
  const errors: { id: string; reason: string }[] = [];

  for (const c of candidates) {
    const url = c.media_url as string;
    if (protectedUrls.has(url) || !url.startsWith(r2Prefix)) {
      skipped++;
      continue;
    }
    const key = url.slice(r2Prefix.length);
    try {
      if (!dryRun) {
        await deleteFromR2(key);
        await admin.from("posts").update({ media_url: null }).eq("id", c.id);
      }
      deleted++;
    } catch (err) {
      failed++;
      errors.push({ id: c.id, reason: err instanceof Error ? err.message : "unknown" });
    }
  }

  console.log(`[cron/cleanup-media] scanned=${candidates.length} deleted=${deleted} skipped=${skipped} failed=${failed} dryRun=${dryRun}`);
  return NextResponse.json({
    ok: true,
    scanned: candidates.length,
    deleted,
    skipped,
    failed,
    dryRun,
    errors: errors.slice(0, 10),
  });
}
