import { createClient } from "@/lib/supabase/server";
import { TodayFeed } from "@/components/dashboard/today-feed";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().split("T")[0];
  const dateBase = new Date(today + "T12:00:00");

  const dateEn = dateBase.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const dateTr = dateBase.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const SELECT_FIELDS = `
    id,
    platform,
    post_type,
    caption,
    hashtags,
    scheduled_date,
    scheduled_time,
    status,
    media_url,
    media_spec,
    projects!inner (
      id,
      name,
      user_id
    )
  `;

  // Today's posts: all active statuses
  const { data: todayRows } = await supabase
    .from("posts")
    .select(SELECT_FIELDS)
    .eq("scheduled_date", today)
    .not("status", "in", '("published","cancelled")')
    .order("scheduled_time", { ascending: true, nullsFirst: false });

  // Past posts: only draft and media_ready (not yet actioned before today)
  const { data: pastRows } = await supabase
    .from("posts")
    .select(SELECT_FIELDS)
    .lt("scheduled_date", today)
    .in("status", ["draft", "media_ready"])
    .order("scheduled_date", { ascending: false })
    .order("scheduled_time", { ascending: true, nullsFirst: false });

  const allRows = [...(todayRows ?? []), ...(pastRows ?? [])];

  // Flatten the joined project fields for the client component
  const posts = allRows.map((row) => {
    const project = (row.projects as unknown) as { id: string; name: string; user_id: string };
    return {
      id: row.id,
      platform: row.platform,
      post_type: row.post_type,
      caption: row.caption,
      hashtags: row.hashtags as string[] | null,
      scheduled_date: row.scheduled_date,
      scheduled_time: row.scheduled_time,
      status: row.status,
      media_url: row.media_url,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      media_spec: row.media_spec as any,
      project_id: project.id,
      project_name: project.name,
    };
  });

  const pendingCount = posts.filter((p) =>
    ["pending", "media_ready", "failed"].includes(p.status),
  ).length;

  return (
    <div className="app-page flex flex-col gap-6 p-8 max-w-3xl">
      <DashboardHeader dateEn={dateEn} dateTr={dateTr} pendingCount={pendingCount} />
      <TodayFeed initialPosts={posts} />
    </div>
  );
}
