"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-context";

export function ThemeToggle() {
  const { t } = useLanguage();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sm-theme");
    if (stored === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      setIsDark(true);
    }
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      localStorage.setItem("sm-theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("sm-theme", "light");
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2.5 px-3 text-muted-foreground hover:text-foreground"
      onClick={toggle}
    >
      {isDark ? (
        <>
          <Sun className="h-4 w-4 shrink-0" />
          <span className="text-sm">{t.theme.lightMode}</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 shrink-0" />
          <span className="text-sm">{t.theme.darkMode}</span>
        </>
      )}
    </Button>
  );
}
