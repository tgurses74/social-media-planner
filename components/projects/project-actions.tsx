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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

const PLATFORMS = [
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "tiktok", label: "TikTok" },
];

interface Project {
  id: string;
  name: string;
  event_name: string;
  event_date: string;
  description: string | null;
  language: string;
  platforms: string[];
  timeframe_start: string;
  timeframe_end: string;
}

export function ProjectActions({ project }: { project: Project }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: project.name,
    event_name: project.event_name,
    event_date: project.event_date,
    description: project.description ?? "",
    language: project.language,
    platforms: project.platforms,
    timeframe_start: project.timeframe_start,
    timeframe_end: project.timeframe_end,
  });

  const initialFormRef = useRef(form);

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

  async function handleSave() {
    if (form.platforms.length === 0) {
      setError(t.projectActions.selectPlatform);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, description: form.description || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function handleEditOpen(open: boolean) {
    if (open) setForm({ ...initialFormRef.current, ...{
      name: project.name,
      event_name: project.event_name,
      event_date: project.event_date,
      description: project.description ?? "",
      language: project.language,
      platforms: project.platforms,
      timeframe_start: project.timeframe_start,
      timeframe_end: project.timeframe_end,
    }});
    setError(null);
    setEditOpen(open);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  }

  return (
    <div className="flex gap-2">
      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={handleEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-3.5 w-3.5" />
            {t.projectActions.editProject}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.projectActions.editProjectTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="p-name">{t.projectActions.projectName}</Label>
              <Input id="p-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-event-name">{t.projectActions.eventName}</Label>
              <Input id="p-event-name" value={form.event_name} onChange={(e) => set("event_name", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="p-event-date">{t.projectActions.eventDate}</Label>
                <Input id="p-event-date" type="date" value={form.event_date} onChange={(e) => set("event_date", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="p-language">{t.projectActions.language}</Label>
                <Select value={form.language} onValueChange={(v) => set("language", v)}>
                  <SelectTrigger id="p-language"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t.projectActions.langEn}</SelectItem>
                    <SelectItem value="tr">{t.projectActions.langTr}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-description">{t.projectActions.description}</Label>
              <Textarea id="p-description" value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>{t.projectActions.platforms}</Label>
              <div className="flex flex-wrap gap-4">
                {PLATFORMS.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`edit-${p.id}`}
                      checked={form.platforms.includes(p.id)}
                      onCheckedChange={() => togglePlatform(p.id)}
                    />
                    <Label htmlFor={`edit-${p.id}`} className="font-normal cursor-pointer">{p.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t.projectActions.postingWindow}</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label className="text-xs text-muted-foreground font-normal">{t.projectActions.start}</Label>
                  <Input type="date" value={form.timeframe_start} onChange={(e) => set("timeframe_start", e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs text-muted-foreground font-normal">{t.projectActions.end}</Label>
                  <Input type="date" value={form.timeframe_end} onChange={(e) => set("timeframe_end", e.target.value)} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>{t.projectActions.cancel}</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.projectActions.saveChanges}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            {t.projectActions.delete}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.projectActions.deleteTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground pt-2">
            {t.projectActions.deleteWarning(project.name)}
          </p>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t.projectActions.cancel}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.projectActions.deleteProject}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
