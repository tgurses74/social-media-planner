"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const { locale, t, setLocale } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2.5 px-3 text-muted-foreground hover:text-foreground"
      onClick={() => setLocale(locale === "en" ? "tr" : "en")}
    >
      <Languages className="h-4 w-4 shrink-0" />
      <span className="text-sm">{t.lang.toggle}</span>
    </Button>
  );
}
