"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderOpen, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

export function NavLinks() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { href: "/dashboard", label: t.nav.today, icon: LayoutDashboard },
    { href: "/projects", label: t.nav.projects, icon: FolderOpen },
    { href: "/settings", label: t.nav.settings, icon: Settings },
  ];

  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-3.5 text-[13px] font-bold uppercase tracking-widest transition-all duration-150",
              isActive
                ? "bg-primary/12 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
