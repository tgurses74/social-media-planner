"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function SettingsPageContent({ tokens, currentEmail, currentTime }: Props) {
  const { t } = useLanguage();

  return (
    <div className="app-page flex flex-col gap-6 p-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t.settings.heading}</h1>
        <p className="text-muted-foreground mt-1">{t.settings.subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.settings.connectedAccounts}</CardTitle>
        </CardHeader>
        <CardContent>
          <ConnectedAccounts tokens={tokens} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.settings.dailyDigest}</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationSettings currentEmail={currentEmail} currentTime={currentTime} />
        </CardContent>
      </Card>
    </div>
  );
}
