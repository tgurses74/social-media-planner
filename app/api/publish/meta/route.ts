import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GRAPH = "https://graph.facebook.com/v25.0";
const PAGE_ID = process.env.META_PAGE_ID!;
const IG_ID = process.env.META_INSTAGRAM_ACCOUNT_ID!;
const TOKEN = process.env.META_PAGE_ACCESS_TOKEN!;

async function graphPost(path: string, body: Record<string, string>): Promise<Record<string, string>> {
  const res = await fetch(`${GRAPH}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, access_token: TOKEN }),
  });
  const data = await res.json();
  if (data.error) {
    console.error("[Meta] graphPost error on", path, JSON.stringify(data.error));
    const sub = data.error.error_subcode ? `/${data.error.error_subcode}` : "";
    throw new Error(`Meta API: ${data.error.message} (code ${data.error.code}${sub})`);
  }
  return data;
}

async function graphGet(path: string, fields: string): Promise<Record<string, string>> {
  const url = `${GRAPH}/${path}?fields=${fields}&access_token=${TOKEN}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) {
    console.error("[Meta] graphGet error on", path, JSON.stringify(data.error));
    const sub = data.error.error_subcode ? `/${data.error.error_subcode}` : "";
    throw new Error(`Meta API: ${data.error.message} (code ${data.error.code}${sub})`);
  }
  return data;
}

// Poll until FINISHED — required for ALL Instagram containers (images can also be async).
async function waitForIgContainer(creationId: string): Promise<void> {
  for (let i = 0; i < 30; i++) {
    const data = await graphGet(creationId, "status_code,status");
    console.log(`[Meta] Container ${creationId} poll ${i + 1}:`, JSON.stringify(data));
    if (data.status_code === "FINISHED") return;
    if (data.status_code === "ERROR") {
      throw new Error(
        `Instagram media processing failed — check that the media URL is publicly accessible and the file format is supported (status: ${data.status ?? "unknown"})`,
      );
    }
    if (data.status_code === "EXPIRED") {
      throw new Error("Instagram media container expired before publishing");
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Instagram media processing timed out (60s)");
}

function isVideo(url: string) {
  return /\.(mp4|mov|webm)$/i.test(url);
}

async function publishFacebook(
  postType: string,
  caption: string,
  mediaUrl: string | null,
): Promise<string> {
  if (!mediaUrl) {
    const d = await graphPost(`${PAGE_ID}/feed`, { message: caption });
    return d.id;
  }
  if (isVideo(mediaUrl) || postType === "video") {
    const d = await graphPost(`${PAGE_ID}/videos`, { file_url: mediaUrl, description: caption });
    return d.id;
  }
  // photo (post, carousel treated as single image)
  const d = await graphPost(`${PAGE_ID}/photos`, { url: mediaUrl, caption });
  return d.post_id ?? d.id;
}

async function publishInstagram(
  postType: string,
  caption: string,
  mediaUrl: string | null,
): Promise<string> {
  if (!mediaUrl) throw new Error("Instagram posts require media. Upload an image or video first.");

  const videoMedia = isVideo(mediaUrl);
  let containerBody: Record<string, string>;

  if (postType === "reel" || (postType === "post" && videoMedia)) {
    containerBody = { media_type: "REELS", video_url: mediaUrl, caption };
  } else if (postType === "story") {
    containerBody = videoMedia
      ? { media_type: "STORIES", video_url: mediaUrl }
      : { media_type: "STORIES", image_url: mediaUrl };
  } else {
    // post or carousel (carousel → single image for now)
    containerBody = { media_type: "IMAGE", image_url: mediaUrl, caption };
  }

  console.log("[Meta] Creating Instagram container:", JSON.stringify({ postType, videoMedia, mediaUrl }));
  const container = await graphPost(`${IG_ID}/media`, containerBody);
  console.log("[Meta] Container created, ID:", container.id);

  // Always poll — both images and videos can be async.
  await waitForIgContainer(container.id);

  console.log("[Meta] Publishing container:", container.id);
  const published = await graphPost(`${IG_ID}/media_publish`, { creation_id: container.id });
  return published.id;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { postId } = await request.json();
  if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });

  const { data: post } = await supabase
    .from("posts")
    .select("*, projects!inner(user_id)")
    .eq("id", postId)
    .single();

  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  if (!["pending", "media_ready", "failed"].includes(post.status)) {
    return NextResponse.json(
      { error: `Cannot publish a post with status '${post.status}'` },
      { status: 400 },
    );
  }
  if (!["facebook", "instagram"].includes(post.platform)) {
    return NextResponse.json({ error: "This endpoint is for facebook and instagram only" }, { status: 400 });
  }

  const fullCaption = post.hashtags?.length
    ? `${post.caption}\n\n${(post.hashtags as string[]).map((h) => `#${h}`).join(" ")}`
    : post.caption;

  await supabase
    .from("posts")
    .update({ status: "publishing", updated_at: new Date().toISOString() })
    .eq("id", postId);

  try {
    const platformPostId =
      post.platform === "facebook"
        ? await publishFacebook(post.post_type, fullCaption, post.media_url)
        : await publishInstagram(post.post_type, fullCaption, post.media_url);

    await supabase
      .from("posts")
      .update({
        status: "published",
        platform_post_id: platformPostId,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    return NextResponse.json({ ok: true, platformPostId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publish failed";
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
