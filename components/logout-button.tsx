"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

export function LogoutButton() {
  const router = useRouter();
  const { t } = useLanguage();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2.5 px-3 text-muted-foreground hover:text-foreground"
      onClick={handleLogout}
    >
      <LogOut className="h-4 w-4 shrink-0" />
      <span className="text-sm">{t.auth.logout}</span>
    </Button>
  );
}
