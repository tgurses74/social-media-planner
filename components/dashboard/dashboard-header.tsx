"use client";

import { useLanguage } from "@/lib/i18n/language-context";

interface Props {
  dateEn: string;
  dateTr: string;
  pendingCount: number;
}

export function DashboardHeader({ dateEn, dateTr, pendingCount }: Props) {
  const { t } = useLanguage();

  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tight">{t.dashboard.heading}</h1>
      <p className="text-base text-muted-foreground mt-1.5">
        {t.locale === "tr" ? dateTr : dateEn}
        {pendingCount > 0 && (
          <span className="ml-2 text-foreground font-medium">
            {t.dashboard.postsNeedAction(pendingCount)}
          </span>
        )}
      </p>
    </div>
  );
}
