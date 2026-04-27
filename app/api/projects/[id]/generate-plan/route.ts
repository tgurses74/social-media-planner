import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateContentPlan, ExtractedEventInfo } from "@/lib/gemini";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: project } = await supabase
    .from("projects")
    .select("*, event_documents(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const extracted =
    (project.event_documents?.[0]?.extracted_content as ExtractedEventInfo | null) ?? null;

  try {
    const posts = await generateContentPlan(project, extracted);

    await supabase.from("posts").delete().eq("project_id", id).eq("status", "draft");

    const { error } = await supabase.from("posts").insert(
      posts.map((p) => ({
        project_id: id,
        scheduled_date: p.scheduled_date,
        scheduled_time: p.scheduled_time ?? null,
        platform: p.platform,
        post_type: p.post_type,
        caption: p.caption,
        hashtags: p.hashtags,
        media_spec: p.media_spec,
        status: "draft",
      })),
    );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: saved } = await supabase
      .from("posts")
      .select("*")
      .eq("project_id", id)
      .order("scheduled_date", { ascending: true });

    return NextResponse.json({ posts: saved ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
