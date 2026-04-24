import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectDetailContent } from "@/components/projects/project-detail-content";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const { data: project } = await supabase
    .from("projects")
    .select("*, event_documents(*)")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!project) notFound();

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("project_id", id)
    .order("scheduled_date", { ascending: true });

  return <ProjectDetailContent project={project} posts={posts ?? []} />;
}
