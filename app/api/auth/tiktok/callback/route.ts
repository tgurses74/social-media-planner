import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getTikTokUserInfo } from "@/lib/tiktok";

// Service-role client bypasses RLS — safe because we verify user identity first.
function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  // Validate state against cookie (CSRF protection)
  const cookieRaw = request.cookies.get("tt_oauth")?.value;
  let cookieData: { state: string; returnTo: string } | null = null;
  try {
    cookieData = cookieRaw ? JSON.parse(cookieRaw) : null;
  } catch {
    cookieData = null;
  }

  if (oauthError || !code || !cookieData || state !== cookieData.state) {
    return NextResponse.redirect(`${APP_URL}/settings?error=tiktok_auth_failed`);
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${APP_URL}/api/auth/tiktok/callback`,
    }),
  });

  if (!tokenRes.ok) {
    console.error("[TikTok callback] token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(`${APP_URL}/settings?error=tiktok_token_failed`);
  }

  const tokenData = await tokenRes.json();

  // TikTok returns error details inside the JSON body on some failures
  if (tokenData.error && tokenData.error !== "ok") {
    console.error("[TikTok callback] token error body:", JSON.stringify(tokenData));
    return NextResponse.redirect(`${APP_URL}/settings?error=tiktok_token_failed`);
  }

  // Fetch display name — open_id is already in tokenData
  let displayName = "";
  try {
    const userInfo = await getTikTokUserInfo(tokenData.access_token);
    displayName = userInfo.displayName;
  } catch (err) {
    // Non-fatal: we still have open_id to identify the account
    console.warn("[TikTok callback] user info failed (non-fatal):", err);
  }

  // Verify the user session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${APP_URL}/login`);
  }

  const admin = adminClient();

  const rowToInsert = {
    user_id: user.id,
    platform: "tiktok",
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token ?? null,
    expires_at: tokenData.expires_in
      ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString()
      : null,
    scope: tokenData.scope ?? null,
    platform_user_id: tokenData.open_id || null,
    platform_user_name: displayName || tokenData.open_id || null,
    updated_at: new Date().toISOString(),
  };

  console.log("[TikTok callback] saving row:", JSON.stringify({
    user_id: user.id,
    platform: "tiktok",
    has_token: !!tokenData.access_token,
    expires_in: tokenData.expires_in,
    open_id: tokenData.open_id,
    display_name: displayName,
  }));

  const { error: upsertError } = await admin.from("oauth_tokens").upsert(
    rowToInsert,
    { onConflict: "user_id,platform" },
  );

  if (upsertError) {
    console.error("[TikTok callback] upsert error:", JSON.stringify(upsertError));
    return NextResponse.redirect(`${APP_URL}/settings?error=tiktok_save_failed`);
  }

  // Clear cookie and redirect
  const response = NextResponse.redirect(
    `${APP_URL}${cookieData.returnTo}?connected=tiktok`,
  );
  response.cookies.delete("tt_oauth");
  return response;
}
