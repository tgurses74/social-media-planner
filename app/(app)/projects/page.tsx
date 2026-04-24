import { createClient } from "@/lib/supabase/server";
import { ProjectsPageContent } from "@/components/projects/projects-page-content";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return <ProjectsPageContent projects={projects ?? []} />;
}
