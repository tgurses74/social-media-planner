"use client";

import { ConnectedAccounts } from "@/components/settings/connected-accounts";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { useLanguage } from "@/lib/i18n/language-context";

interface TokenRow {
  platform: string;
  platform_user_name: string | null;
  expires_at: string | null;
}

interface Props {
  tokens: TokenRow[];
  currentEmail: string | null;
  currentTime: string | null;
}

const SHADOW = "rgba(0,0,0,0.04) 0px 4px 18px, rgba(0,0,0,0.027) 0px 2.025px 7.85px, rgba(0,0,0,0.02) 0px 0.8px 2.93px, rgba(0,0,0,0.01) 0px 0.175px 1.04px";

export function SettingsPageContent({ tokens, currentEmail, currentTime }: Props) {
  const { t } = useLanguage();

  return (
    <div className="app-page" style={{ display: "flex", flexDirection: "column", gap: "28px", padding: "48px 48px 64px", maxWidth: "860px" }}>
      <div>
        <h1 style={{ fontSize: "40px", fontWeight: 700, letterSpacing: "-1px", color: "rgba(0,0,0,0.95)", lineHeight: 1.15, margin: 0 }}>
          {t.settings.heading}
        </h1>
        <p style={{ fontSize: "17px", color: "#615d59", margin: "10px 0 0", lineHeight: 1.5 }}>
          {t.settings.subtitle}
        </p>
      </div>

      <div style={{ borderRadius: "14px", border: "1px solid rgba(0,0,0,0.1)", background: "#fff", boxShadow: SHADOW }}>
        <div style={{ padding: "22px 28px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.4px", color: "rgba(0,0,0,0.92)", margin: 0 }}>
            {t.settings.connectedAccounts}
          </h2>
        </div>
        <div style={{ padding: "22px 28px" }}>
          <ConnectedAccounts tokens={tokens} />
        </div>
      </div>

      <div style={{ borderRadius: "14px", border: "1px solid rgba(0,0,0,0.1)", background: "#fff", boxShadow: SHADOW }}>
        <div style={{ padding: "22px 28px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.4px", color: "rgba(0,0,0,0.92)", margin: 0 }}>
            {t.settings.dailyDigest}
          </h2>
        </div>
        <div style={{ padding: "22px 28px" }}>
          <NotificationSettings currentEmail={currentEmail} currentTime={currentTime} />
        </div>
      </div>
    </div>
  );
}
