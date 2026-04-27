import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPresignedPutUrl } from "@/lib/r2";
import { randomUUID } from "crypto";

const SUPPORTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { filename, contentType } = await request.json();

  if (!filename || !contentType) {
    return NextResponse.json({ error: "filename and contentType are required" }, { status: 400 });
  }

  if (!SUPPORTED_VIDEO_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "Only video files are supported for direct upload" }, { status: 400 });
  }

  const ext = filename.split(".").pop() ?? "mp4";
  const key = `media/${user.id}/${randomUUID()}.${ext}`;

  try {
    const { uploadUrl, publicUrl } = await getPresignedPutUrl(key, contentType);
    return NextResponse.json({ uploadUrl, publicUrl, mimeType: contentType });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate upload URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
