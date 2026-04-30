import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { NavLinks } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { MobileNav } from "@/components/mobile-nav";

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
      <aside className="hidden md:flex w-64 border-r border-border bg-sidebar flex-col p-4 gap-2 shrink-0">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 px-2 py-3 mb-1 group">
          <img
            src="/logo.svg"
            alt="SM Planner"
            style={{ width: "38px", height: "38px", borderRadius: "8px", flexShrink: 0 }}
          />
          <div style={{ lineHeight: 1.2 }}>
            <span className="text-sm font-bold tracking-tight block">SM Planner</span>
            <span className="text-[11px] text-muted-foreground font-medium">by Openborders</span>
          </div>
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

      <div className="flex flex-col flex-1 min-w-0">
        <MobileNav userEmail={user?.email ?? null} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
