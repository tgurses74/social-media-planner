import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
// w_member_social = post on behalf of member
// openid + profile = get person ID via /v2/userinfo
const SCOPES = ["openid", "profile", "email", "w_member_social"];

export async function GET(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/projects";
  const state = randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`,
    scope: SCOPES.join(" "),
    state,
  });

  const response = NextResponse.redirect(`${LINKEDIN_AUTH_URL}?${params}`);

  // Store state + returnTo in an httpOnly cookie for CSRF validation
  response.cookies.set(
    "li_oauth",
    JSON.stringify({ state, returnTo }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    },
  );

  return response;
}
