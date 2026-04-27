import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publishLinkedInPost } from "@/lib/linkedin";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { postId } = await request.json();
  if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });

  // Fetch post and verify ownership via project
  const { data: post } = await supabase
    .from("posts")
    .select("*, projects!inner(user_id)")
    .eq("id", postId)
    .single();

  if (!post || (post.projects as { user_id: string }).user_id !== user.id) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (!["pending", "media_ready", "failed"].includes(post.status)) {
    return NextResponse.json(
      { error: `Cannot publish a post with status '${post.status}'` },
      { status: 400 },
    );
  }

  // Fetch LinkedIn token
  const { data: tokenRow } = await supabase
    .from("oauth_tokens")
    .select("*")
    .eq("user_id", user.id)
    .eq("platform", "linkedin")
    .single();

  if (!tokenRow) {
    return NextResponse.json(
      { error: "LinkedIn account not connected", code: "NOT_CONNECTED" },
      { status: 400 },
    );
  }

  if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "LinkedIn token expired. Please reconnect in Settings.", code: "TOKEN_EXPIRED" },
      { status: 401 },
    );
  }

  // Mark as publishing
  await supabase
    .from("posts")
    .update({ status: "publishing", updated_at: new Date().toISOString() })
    .eq("id", postId);

  try {
    const caption = [
      post.caption,
      ...(post.hashtags ?? []).map((h: string) => `#${h}`),
    ].join("\n\n");

    const platformPostId = await publishLinkedInPost(
      tokenRow.access_token,
      tokenRow.platform_user_id,
      caption,
      post.media_url ?? null,
    );

    await supabase
      .from("posts")
      .update({
        status: "published",
        platform_post_id: platformPostId,
        published_at: new Date().toISOString(),
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    return NextResponse.json({ ok: true, platformPostId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "LinkedIn publish failed";
    await supabase
      .from("posts")
      .update({
        status: "failed",
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
