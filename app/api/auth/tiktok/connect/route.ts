import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function GET(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/settings";

  const state = randomBytes(16).toString("hex");
  const cookieValue = JSON.stringify({ state, returnTo });

  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    scope: "user.info.basic,video.publish",
    response_type: "code",
    redirect_uri: `${APP_URL}/api/auth/tiktok/callback`,
    state,
  });

  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${params}`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("tt_oauth", cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  return response;
}
