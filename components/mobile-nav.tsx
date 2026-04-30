"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLinks } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { LogoutButton } from "@/components/logout-button";

interface Props {
  userEmail: string | null;
}

export function MobileNav({ userEmail }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 h-14 border-b border-border bg-sidebar sticky top-0 z-20">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <img
            src="/logo.svg"
            alt="SM Planner"
            style={{ width: "34px", height: "34px", borderRadius: "7px" }}
          />
          <div style={{ lineHeight: 1.2 }}>
            <span className="text-sm font-bold tracking-tight block">SM Planner</span>
            <span className="text-[10px] text-muted-foreground font-medium">by Openborders</span>
          </div>
        </Link>
        <button
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-border flex flex-col p-4 gap-2 transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-2 py-3 mb-1"
          onClick={() => setOpen(false)}
        >
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

        <NavLinks />

        <div className="mt-auto flex flex-col gap-1 border-t border-border pt-3">
          <ThemeToggle />
          <LanguageToggle />
          {userEmail && (
            <div className="px-3 py-1.5 text-xs text-muted-foreground truncate">
              {userEmail}
            </div>
          )}
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
