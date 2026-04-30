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
      <h1 style={{ fontSize: "40px", fontWeight: 700, letterSpacing: "-1px", color: "rgba(0,0,0,0.95)", lineHeight: 1.15, margin: 0 }}>
        {t.dashboard.heading}
      </h1>
      <p style={{ fontSize: "17px", color: "#615d59", margin: "10px 0 0", lineHeight: 1.5 }}>
        {t.locale === "tr" ? dateTr : dateEn}
        {pendingCount > 0 && (
          <span style={{ marginLeft: "8px", fontWeight: 600, color: "rgba(0,0,0,0.85)" }}>
            · {t.dashboard.postsNeedAction(pendingCount)}
          </span>
        )}
      </p>
    </div>
  );
}
