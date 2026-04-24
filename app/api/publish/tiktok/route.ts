import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publishTikTokPost } from "@/lib/tiktok";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  if (!post.media_url) {
    return NextResponse.json(
      {
        error: "TikTok requires media. Please upload an image or video before publishing.",
        code: "NO_MEDIA",
      },
      { status: 400 },
    );
  }

  // Fetch TikTok token
  const { data: tokenRow } = await supabase
    .from("oauth_tokens")
    .select("*")
    .eq("user_id", user.id)
    .eq("platform", "tiktok")
    .single();

  if (!tokenRow) {
    return NextResponse.json(
      { error: "TikTok account not connected", code: "NOT_CONNECTED" },
      { status: 400 },
    );
  }

  if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "TikTok token expired. Please reconnect in Settings.", code: "TOKEN_EXPIRED" },
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

    const publishId = await publishTikTokPost(
      tokenRow.access_token,
      caption,
      post.media_url,
    );

    await supabase
      .from("posts")
      .update({
        status: "published",
        platform_post_id: publishId,
        published_at: new Date().toISOString(),
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    return NextResponse.json({ ok: true, publishId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TikTok publish failed";
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
