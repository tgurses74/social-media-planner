"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <div className="flex flex-col gap-3">
      {PLATFORMS.map(({ id, label }) => {
        const token = connected[id];
        return (
          <div
            key={id}
            className="flex items-center justify-between rounded-lg border px-4 py-3"
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-sm">{label}</span>
              {token ? (
                <span className="text-xs text-muted-foreground">
                  {token.platform_user_name ?? t.settings.connected}
                  {token.expires_at && (
                    <> · {t.settings.expires} {new Date(token.expires_at).toLocaleDateString(t.dateLocale)}</>
                  )}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">{t.settings.notConnected}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {token ? (
                <>
                  <Badge variant="secondary" className="text-green-600 bg-green-500/10">
                    {t.settings.connected}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(id)}
                    disabled={disconnecting === id}
                  >
                    {disconnecting === id && (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    )}
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
