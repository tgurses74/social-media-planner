import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    name,
    event_name,
    event_date,
    description,
    language,
    platforms,
    timeframe_start,
    timeframe_end,
    documents,
  } = body;

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name,
      event_name,
      event_date,
      description: description || null,
      language,
      platforms,
      timeframe_start,
      timeframe_end,
    })
    .select()
    .single();

  if (error || !project) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create project" },
      { status: 500 },
    );
  }

  if (documents?.length) {
    await supabase.from("event_documents").insert(
      documents.map((doc: {
        url: string;
        filename: string;
        mimeType: string;
        size: number;
        extracted: Record<string, unknown> | null;
      }) => ({
        project_id: project.id,
        filename: doc.filename,
        file_url: doc.url,
        mime_type: doc.mimeType,
        size_bytes: doc.size,
        extracted_content: doc.extracted ?? null,
      })),
    );
  }

  return NextResponse.json({ id: project.id });
}
