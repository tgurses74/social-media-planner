import { createClient } from "@/lib/supabase/server";
import { SettingsPageContent } from "@/components/settings/settings-page-content";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const [{ data: tokens }, { data: profile }] = await Promise.all([
    supabase
      .from("oauth_tokens")
      .select("platform, platform_user_name, expires_at")
      .eq("user_id", user!.id),
    supabase
      .from("profiles")
      .select("notification_email, notification_time")
      .eq("id", user!.id)
      .single(),
  ]);

  return (
    <SettingsPageContent
      tokens={tokens ?? []}
      currentEmail={profile?.notification_email ?? null}
      currentTime={profile?.notification_time ?? null}
    />
  );
}
