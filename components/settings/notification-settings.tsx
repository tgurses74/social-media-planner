"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

interface Props {
  currentEmail: string | null;
  currentTime: string | null;
}

export function NotificationSettings({ currentEmail, currentTime }: Props) {
  const { t } = useLanguage();
  const [email, setEmail] = useState(currentEmail ?? "");
  const [time, setTime] = useState(currentTime?.slice(0, 5) ?? "08:00");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notification_email: email || null,
          notification_time: time + ":00",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-2">
        <Label htmlFor="notif-email">{t.settings.notifEmail}</Label>
        <Input
          id="notif-email"
          type="email"
          placeholder={t.settings.notifEmailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">{t.settings.notifEmailHint}</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notif-time">{t.settings.sendTime}</Label>
        <Input
          id="notif-time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-32"
        />
        <p className="text-xs text-muted-foreground">
          {t.settings.sendTimeHint}{" "}
          <code className="font-mono text-xs">vercel.json</code>.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
          {t.settings.save}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle className="h-3.5 w-3.5" />
            {t.settings.saved}
          </span>
        )}
      </div>
    </div>
  );
}
