import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

// This route is called by Vercel Cron at 05:00 UTC (= 08:00 Istanbul).
// Vercel automatically sends the Authorization: Bearer CRON_SECRET header.

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = adminClient();
  const today = new Date().toISOString().split("T")[0];

  // Fetch all posts scheduled for today that are actionable
  const { data: posts, error: postsError } = await admin
    .from("posts")
    .select(`
      id,
      platform,
      post_type,
      caption,
      scheduled_time,
      status,
      media_url,
      projects!inner (
        id,
        name,
        user_id
      )
    `)
    .eq("scheduled_date", today)
    .not("status", "in", '("published","cancelled")')
    .order("scheduled_time", { ascending: true });

  if (postsError) {
    console.error("[cron/daily-digest] posts query error:", postsError);
    return NextResponse.json({ error: postsError.message }, { status: 500 });
  }

  if (!posts || posts.length === 0) {
    console.log("[cron/daily-digest] no posts today, skipping emails");
    return NextResponse.json({ ok: true, sent: 0 });
  }

  // Group posts by user_id
  const byUser = new Map<string, typeof posts>();
  for (const post of posts) {
    const project = (post.projects as unknown) as { id: string; name: string; user_id: string };
    const uid = project.user_id;
    if (!byUser.has(uid)) byUser.set(uid, []);
    byUser.get(uid)!.push(post);
  }

  // Fetch profiles + auth emails for the affected users
  const userIds = Array.from(byUser.keys());
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, notification_email")
    .in("id", userIds);

  const { data: authUsers } = await admin.auth.admin.listUsers();

  let sent = 0;

  for (const [userId, userPosts] of byUser.entries()) {
    // Determine the recipient email
    const profile = profiles?.find((p) => p.id === userId);
    const authUser = authUsers?.users?.find((u) => u.id === userId);
    const toEmail = profile?.notification_email || authUser?.email;

    if (!toEmail) {
      console.warn(`[cron/daily-digest] no email for user ${userId}, skipping`);
      continue;
    }

    // Group this user's posts by project
    const byProject = new Map<string, { name: string; posts: typeof userPosts }>();
    for (const post of userPosts) {
      const project = (post.projects as unknown) as { id: string; name: string; user_id: string };
      if (!byProject.has(project.id)) {
        byProject.set(project.id, { name: project.name, posts: [] });
      }
      byProject.get(project.id)!.posts.push(post);
    }

    // Build email HTML
    const projectBlocks = Array.from(byProject.entries())
      .map(([projectId, { name, posts: pPosts }]) => {
        const rows = pPosts
          .map((p) => {
            const time = p.scheduled_time
              ? p.scheduled_time.slice(0, 5)
              : "—";
            const needsMedia = p.status === "pending" ? " ⚠️ needs media" : "";
            return `<tr>
              <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;">${PLATFORM_LABELS[p.platform] ?? p.platform}</td>
              <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;text-transform:capitalize;">${p.post_type}</td>
              <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;">${time}</td>
              <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;color:#555;font-size:13px;">${(p.caption ?? "").slice(0, 80)}…${needsMedia}</td>
            </tr>`;
          })
          .join("");

        return `
          <div style="margin-bottom:24px;">
            <h3 style="font-size:15px;font-weight:600;margin:0 0 8px;color:#111;">
              📁 ${name}
            </h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e8e8e8;">
              <thead>
                <tr style="background:#f8f8f8;">
                  <th style="padding:8px 12px;text-align:left;color:#555;font-weight:500;">Platform</th>
                  <th style="padding:8px 12px;text-align:left;color:#555;font-weight:500;">Type</th>
                  <th style="padding:8px 12px;text-align:left;color:#555;font-weight:500;">Time</th>
                  <th style="padding:8px 12px;text-align:left;color:#555;font-weight:500;">Caption</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <div style="margin-top:8px;">
              <a href="${APP_URL}/projects/${projectId}" style="font-size:13px;color:#2563eb;">Open project →</a>
            </div>
          </div>`;
      })
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;padding:32px 16px;color:#111;">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e8e8e8;">
          <h1 style="font-size:22px;font-weight:700;margin:0 0 4px;">📅 Today's posts</h1>
          <p style="color:#666;margin:0 0 24px;font-size:14px;">${formatDate(today)} · ${userPosts.length} post${userPosts.length !== 1 ? "s" : ""} scheduled</p>
          ${projectBlocks}
          <div style="margin-top:24px;padding-top:24px;border-top:1px solid #e8e8e8;text-align:center;">
            <a href="${APP_URL}/dashboard" style="display:inline-block;background:#111;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">Open Dashboard →</a>
          </div>
        </div>
      </body>
      </html>`;

    try {
      await sendEmail({
        to: toEmail,
        subject: `📅 Today's posts — ${userPosts.length} scheduled for ${formatDate(today)}`,
        html,
      });
      sent++;
    } catch (err) {
      console.error(`[cron/daily-digest] email failed for ${toEmail}:`, err);
    }
  }

  return NextResponse.json({ ok: true, sent, today });
}
