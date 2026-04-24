const TIKTOK_API_BASE = "https://open.tiktokapis.com/v2";

export async function getTikTokUserInfo(
  accessToken: string,
): Promise<{ openId: string; displayName: string }> {
  const res = await fetch(
    `${TIKTOK_API_BASE}/user/info/?fields=open_id,display_name`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!res.ok) {
    throw new Error(`TikTok user info request failed: ${res.status}`);
  }

  const data = await res.json();
  if (data.error?.code && data.error.code !== "ok") {
    throw new Error(`TikTok user info error: ${data.error.message}`);
  }

  return {
    openId: data.data.user.open_id,
    displayName: data.data.user.display_name,
  };
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|avi|webm)(\?|$)/i.test(url);
}

/**
 * Publishes a post to TikTok via the Content Posting API (PULL_FROM_URL).
 * - Image URL  → PHOTO post  (/post/publish/content/init/)
 * - Video URL  → VIDEO post  (/post/publish/video/init/)
 * - No media   → throws (TikTok requires media)
 *
 * Returns the TikTok publish_id.
 */
export async function publishTikTokPost(
  accessToken: string,
  caption: string,
  mediaUrl?: string | null,
): Promise<string> {
  if (!mediaUrl) {
    throw new Error("TikTok requires media (image or video) to publish a post");
  }

  const title = caption.slice(0, 2200);

  if (isVideoUrl(mediaUrl)) {
    const body = {
      post_info: {
        title,
        privacy_level: "PUBLIC_TO_EVERYONE",
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: mediaUrl,
      },
      post_mode: "DIRECT_POST",
      media_type: "VIDEO",
    };

    const res = await fetch(`${TIKTOK_API_BASE}/post/publish/video/init/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.error?.code && data.error.code !== "ok") {
      throw new Error(`TikTok publish failed: ${data.error.message}`);
    }
    return data.data.publish_id;
  }

  // Photo post
  const body = {
    post_info: {
      title,
      privacy_level: "PUBLIC_TO_EVERYONE",
      disable_duet: false,
      disable_comment: false,
      disable_stitch: false,
    },
    source_info: {
      source: "PULL_FROM_URL",
      photo_images: [mediaUrl],
      photo_cover_index: 0,
    },
    post_mode: "DIRECT_POST",
    media_type: "PHOTO",
  };

  const res = await fetch(`${TIKTOK_API_BASE}/post/publish/content/init/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (data.error?.code && data.error.code !== "ok") {
    throw new Error(`TikTok publish failed: ${data.error.message}`);
  }
  return data.data.publish_id;
}
