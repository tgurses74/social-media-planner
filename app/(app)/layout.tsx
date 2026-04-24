import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { NavLinks } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col p-4 gap-2 shrink-0">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 px-2 py-3 mb-1 group">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-md">
            SM
          </div>
          <span className="text-lg font-bold tracking-tight">SM Planner</span>
        </Link>

        {/* Nav */}
        <NavLinks />

        {/* Bottom */}
        <div className="mt-auto flex flex-col gap-1 border-t border-border pt-3">
          <ThemeToggle />
          <LanguageToggle />
          <div className="px-3 py-1.5 text-xs text-muted-foreground truncate">
            {user?.email}
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
