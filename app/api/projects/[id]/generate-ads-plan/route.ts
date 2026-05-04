import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateMetaAdsPlan } from "@/lib/gemini";

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
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { data: posts } = await supabase
    .from("posts")
    .select("scheduled_date, post_type, caption, platform")
    .eq("project_id", id)
    .eq("platform", "instagram")
    .order("scheduled_date", { ascending: true });

  const instagramPosts = (posts ?? []).map((p) => ({
    scheduled_date: p.scheduled_date,
    post_type: p.post_type,
    caption: p.caption,
  }));

  try {
    const plan = await generateMetaAdsPlan(project, instagramPosts);

    await supabase
      .from("projects")
      .update({ meta_ads_plan: plan })
      .eq("id", id);

    return NextResponse.json({ plan });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
