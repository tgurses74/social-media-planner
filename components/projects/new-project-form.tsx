"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, FileText, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

const PLATFORMS = [
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "tiktok", label: "TikTok" },
];

interface UploadedDoc {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  extracted: Record<string, unknown> | null;
}

export function NewProjectForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    name: "",
    event_name: "",
    event_date: "",
    description: "",
    language: "en",
    platforms: [] as string[],
    timeframe_start: today,
    timeframe_end: "",
  });

  const [doc, setDoc] = useState<UploadedDoc | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function togglePlatform(id: string) {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(id)
        ? f.platforms.filter((p) => p !== id)
        : [...f.platforms, id],
    }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload-and-extract", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setDoc({ url: data.url, filename: data.filename, mimeType: data.mimeType, size: data.size, extracted: data.extracted ?? null });

      const ex = data.extracted;
      setForm((f) => ({
        ...f,
        event_name: ex.event_name ?? f.event_name,
        event_date: ex.event_date ?? f.event_date,
        description: ex.description ?? f.description,
        timeframe_end: ex.event_date ?? f.timeframe_end,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.platforms.length === 0) {
      setError(t.newProject.selectPlatform);
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, documents: doc ? [doc] : [] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/projects/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Document upload */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-2">
            <Label>
              {t.newProject.eventDocument}{" "}
              <span className="text-muted-foreground font-normal">{t.newProject.docHint}</span>
            </Label>
            {doc ? (
              <div className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">{doc.filename}</span>
                <button
                  type="button"
                  onClick={() => { setDoc(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={extracting}
                className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-sm text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors disabled:opacity-50"
              >
                {extracting ? (
                  <><Loader2 className="h-6 w-6 animate-spin" />{t.newProject.extracting}</>
                ) : (
                  <><Upload className="h-6 w-6" />{t.newProject.clickToUploadDoc}</>
                )}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.txt,.md"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Basic info */}
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">
            {t.newProject.projectName} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Istanbul Design Festival — Social"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="event_name">
            {t.newProject.eventName} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="event_name"
            value={form.event_name}
            onChange={(e) => set("event_name", e.target.value)}
            placeholder="Istanbul Design Festival 2026"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="event_date">
              {t.newProject.eventDate} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="event_date"
              type="date"
              value={form.event_date}
              onChange={(e) => set("event_date", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="language">
              {t.newProject.language} <span className="text-destructive">*</span>
            </Label>
            <Select value={form.language} onValueChange={(v) => set("language", v)}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t.newProject.langEn}</SelectItem>
                <SelectItem value="tr">{t.newProject.langTr}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">{t.newProject.description}</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder={t.newProject.descPlaceholder}
            rows={3}
          />
        </div>
      </div>

      {/* Platforms */}
      <div className="grid gap-3">
        <Label>
          {t.newProject.platforms} <span className="text-destructive">*</span>
        </Label>
        <div className="flex flex-wrap gap-4">
          {PLATFORMS.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <Checkbox
                id={p.id}
                checked={form.platforms.includes(p.id)}
                onCheckedChange={() => togglePlatform(p.id)}
              />
              <Label htmlFor={p.id} className="font-normal cursor-pointer">{p.label}</Label>
            </div>
          ))}
        </div>
        {form.platforms.length > 0 && (
          <div className="flex gap-1">
            {form.platforms.map((p) => (
              <Badge key={p} variant="secondary" className="capitalize">{p}</Badge>
            ))}
          </div>
        )}
      </div>

      {/* Timeframe */}
      <div className="grid gap-2">
        <Label>
          {t.newProject.postingTimeframe} <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="timeframe_start" className="text-xs text-muted-foreground font-normal">
              {t.newProject.start}
            </Label>
            <Input
              id="timeframe_start"
              type="date"
              value={form.timeframe_start}
              onChange={(e) => set("timeframe_start", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="timeframe_end" className="text-xs text-muted-foreground font-normal">
              {t.newProject.endEventDate}
            </Label>
            <Input
              id="timeframe_end"
              type="date"
              value={form.timeframe_end}
              onChange={(e) => set("timeframe_end", e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting || extracting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitting ? t.newProject.creating : t.newProject.createProject}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t.newProject.cancel}
        </Button>
      </div>
    </form>
  );
}
