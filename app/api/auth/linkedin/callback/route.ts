import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getLinkedInProfile } from "@/lib/linkedin";

// Service-role client bypasses RLS — safe here because we verify the user
// identity ourselves via auth.getUser() before writing.
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
  const cookieRaw = request.cookies.get("li_oauth")?.value;
  let cookieData: { state: string; returnTo: string } | null = null;
  try {
    cookieData = cookieRaw ? JSON.parse(cookieRaw) : null;
  } catch {
    cookieData = null;
  }

  if (oauthError || !code || !cookieData || state !== cookieData.state) {
    return NextResponse.redirect(`${APP_URL}/settings?error=linkedin_auth_failed`);
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${APP_URL}/api/auth/linkedin/callback`,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${APP_URL}/settings?error=linkedin_token_failed`);
  }

  const tokenData = await tokenRes.json();

  // Fetch LinkedIn profile to get the person ID
  let profile: { sub: string; name: string } = { sub: "", name: "" };
  try {
    profile = await getLinkedInProfile(tokenData.access_token);
  } catch {
    return NextResponse.redirect(`${APP_URL}/settings?error=linkedin_profile_failed`);
  }

  // Verify the user session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${APP_URL}/login`);
  }

  // Use service-role client for the write so RLS never blocks it
  const admin = adminClient();

  const rowToInsert = {
    user_id: user.id,
    platform: "linkedin",
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token ?? null,
    expires_at: tokenData.expires_in
      ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString()
      : null,
    scope: tokenData.scope ?? null,
    platform_user_id: profile.sub || null,
    platform_user_name: profile.name || null,
    updated_at: new Date().toISOString(),
  };

  console.log("[LinkedIn callback] saving row:", JSON.stringify({
    user_id: user.id,
    platform: "linkedin",
    has_token: !!tokenData.access_token,
    expires_in: tokenData.expires_in,
    profile_sub: profile.sub,
    profile_name: profile.name,
  }));

  const { error: upsertError } = await admin.from("oauth_tokens").upsert(
    rowToInsert,
    { onConflict: "user_id,platform" },
  );

  if (upsertError) {
    console.error("[LinkedIn callback] upsert error:", JSON.stringify(upsertError));
    return NextResponse.redirect(`${APP_URL}/settings?error=linkedin_save_failed`);
  }

  // Clear cookie and redirect back
  const response = NextResponse.redirect(
    `${APP_URL}${cookieData.returnTo}?connected=linkedin`,
  );
  response.cookies.delete("li_oauth");
  return response;
}
