"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

interface TokenRow {
  platform: string;
  platform_user_name: string | null;
  expires_at: string | null;
}

interface Props {
  tokens: TokenRow[];
}

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "tiktok", label: "TikTok" },
];

export function ConnectedAccounts({ tokens }: Props) {
  const router = useRouter();
  const { t } = useLanguage();
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const connected = Object.fromEntries(tokens.map((tok) => [tok.platform, tok]));

  async function handleDisconnect(platform: string) {
    setDisconnecting(platform);
    await fetch(`/api/auth/${platform}/disconnect`, { method: "POST" });
    setDisconnecting(null);
    router.refresh();
  }

  function handleConnect(platform: string) {
    window.location.href = `/api/auth/${platform}/connect?returnTo=/settings`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {PLATFORMS.map(({ id, label }) => {
        const token = connected[id];
        return (
          <div
            key={id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: "10px",
              border: "1px solid rgba(0,0,0,0.09)",
              padding: "16px 20px",
              background: "#fafaf9",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "16px", fontWeight: 600, color: "rgba(0,0,0,0.9)" }}>{label}</span>
              {token ? (
                <span style={{ fontSize: "14px", color: "#615d59" }}>
                  {token.platform_user_name ?? t.settings.connected}
                  {token.expires_at && (
                    <> · {t.settings.expires} {new Date(token.expires_at).toLocaleDateString(t.dateLocale)}</>
                  )}
                </span>
              ) : (
                <span style={{ fontSize: "14px", color: "#a39e98" }}>{t.settings.notConnected}</span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {token ? (
                <>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#16a34a", background: "#dcfce7", padding: "3px 10px", borderRadius: "9999px" }}>
                    {t.settings.connected}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(id)}
                    disabled={disconnecting === id}
                  >
                    {disconnecting === id && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                    {t.settings.disconnect}
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => handleConnect(id)}>
                  {t.settings.connect}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
