const BASE = "https://api.linkedin.com/v2";

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Restli-Protocol-Version": "2.0.0",
  };
}

export interface LinkedInProfile {
  sub: string;
  name: string;
  email?: string;
}

export async function getLinkedInProfile(accessToken: string): Promise<LinkedInProfile> {
  const res = await fetch(`${BASE}/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch LinkedIn profile");
  return res.json();
}

/**
 * Upload an image from a public URL to LinkedIn's media asset system.
 * Returns the asset URN to include in the ugcPost body.
 */
async function uploadLinkedInImage(token: string, personId: string, imageUrl: string): Promise<string> {
  // 1. Register the upload
  const registerRes = await fetch(`${BASE}/assets?action=registerUpload`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: `urn:li:person:${personId}`,
        serviceRelationships: [
          { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" },
        ],
      },
    }),
  });
  if (!registerRes.ok) {
    const err = await registerRes.text();
    throw new Error(`LinkedIn image register failed: ${err}`);
  }
  const registerData = await registerRes.json();
  const uploadUrl: string =
    registerData.value.uploadMechanism[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ].uploadUrl;
  const assetUrn: string = registerData.value.asset;

  // 2. Fetch the image from R2 and upload binary to LinkedIn
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error("Failed to fetch image from storage");
  const imageBuffer = await imageRes.arrayBuffer();

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: imageBuffer,
  });
  if (!uploadRes.ok) throw new Error("LinkedIn image upload failed");

  return assetUrn;
}

/**
 * Publish a post to LinkedIn as the authenticated member.
 * Supports text-only and single-image posts.
 */
export async function publishLinkedInPost(
  token: string,
  personId: string,
  caption: string,
  mediaUrl?: string | null,
): Promise<string | null> {
  let assetUrn: string | null = null;
  if (mediaUrl && !mediaUrl.match(/\.(mp4|mov|webm)$/i)) {
    assetUrn = await uploadLinkedInImage(token, personId, mediaUrl);
  }

  const body = {
    author: `urn:li:person:${personId}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: caption },
        shareMediaCategory: assetUrn ? "IMAGE" : "NONE",
        ...(assetUrn && { media: [{ status: "READY", media: assetUrn }] }),
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const res = await fetch(`${BASE}/ugcPosts`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || JSON.stringify(err));
  }

  const data = await res.json();
  return data.id ?? res.headers.get("x-restli-id") ?? null;
}
