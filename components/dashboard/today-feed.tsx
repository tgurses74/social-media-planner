"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Send,
  Upload,
  CheckCircle,
  AlertCircle,
  Pencil,
  X,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

interface MediaSpec {
  type: string;
  orientation: string;
  ratio: string;
  resolution: string;
  max_size_mb: number;
  duration_seconds: number | null;
}

interface Post {
  id: string;
  platform: string;
  post_type: string;
  caption: string;
  hashtags: string[] | null;
  scheduled_date: string;
  scheduled_time: string | null;
  status: string;
  media_url: string | null;
  media_spec: MediaSpec;
  project_id: string;
  project_name: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  instagram: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  linkedin: "bg-sky-600/10 text-sky-600 border-sky-600/20",
  tiktok: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-yellow-500/10 text-yellow-600",
  media_ready: "bg-blue-500/10 text-blue-600",
  publishing: "bg-orange-500/10 text-orange-600",
  published: "bg-green-500/10 text-green-600",
  failed: "bg-red-500/10 text-red-600",
};

const PUBLISH_ENDPOINTS: Record<string, string> = {
  facebook: "/api/publish/meta",
  instagram: "/api/publish/meta",
  linkedin: "/api/publish/linkedin",
  tiktok: "/api/publish/tiktok",
};

interface Props {
  initialPosts: Post[];
}

export function TodayFeed({ initialPosts }: Props) {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editPost, setEditPost] = useState<Post | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editHashtags, setEditHashtags] = useState("");
  const [editMediaUrl, setEditMediaUrl] = useState<string | null>(null);
  const [editMediaMime, setEditMediaMime] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function openEdit(post: Post) {
    setEditPost(post);
    setEditCaption(post.caption);
    setEditHashtags((post.hashtags ?? []).join(", "));
    setEditMediaUrl(post.media_url ?? null);
    setEditMediaMime(null);
    setModalError(null);
  }

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const isVideo = file.type.startsWith("video/");

      if (isVideo) {
        // Videos: get a presigned URL, then PUT directly to R2 (bypasses Vercel 4.5 MB limit)
        const presignRes = await fetch("/api/upload-media/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        });
        const presignData = await presignRes.json();
        if (!presignRes.ok) throw new Error(presignData.error);

        const putRes = await fetch(presignData.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!putRes.ok) throw new Error("Direct upload to storage failed");

        setEditMediaUrl(presignData.publicUrl);
        setEditMediaMime(presignData.mimeType);
      } else {
        // Images: proxy through Vercel API (small files, no size issue)
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload-media", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setEditMediaUrl(data.url);
        setEditMediaMime(data.mimeType);
      }
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!editPost) return;
    setSaving(true);
    setModalError(null);
    try {
      const newStatus =
        editMediaUrl && editPost.status === "draft" ? "media_ready" : editPost.status;
      const updatedHashtags = editHashtags.split(",").map((h) => h.trim()).filter(Boolean);

      const res = await fetch(`/api/posts/${editPost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: editCaption,
          hashtags: updatedHashtags,
          media_url: editMediaUrl,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPosts((prev) =>
        prev.map((p) =>
          p.id === editPost.id
            ? { ...p, caption: editCaption, hashtags: updatedHashtags, media_url: editMediaUrl, status: newStatus }
            : p,
        ),
      );
      setEditPost(null);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(post: Post) {
    const endpoint = PUBLISH_ENDPOINTS[post.platform];
    if (!endpoint) {
      setError(`Publishing for ${post.platform} is not yet available.`);
      return;
    }

    setPublishingId(post.id);
    setError(null);
    setModalError(null);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "NOT_CONNECTED" || data.code === "TOKEN_EXPIRED") {
          throw new Error(`${data.error} — go to Settings → Connected Accounts.`);
        }
        throw new Error(data.error);
      }
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, status: "published" } : p)),
      );
      setEditPost(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Publish failed";
      setModalError(msg);
      setError(msg);
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, status: "failed" } : p)),
      );
    } finally {
      setPublishingId(null);
    }
  }

  async function handleSaveAndPublish() {
    if (!editPost) return;
    setSaving(true);
    setModalError(null);
    try {
      const newStatus =
        editMediaUrl && editPost.status === "draft" ? "media_ready" : editPost.status;
      const updatedHashtags = editHashtags.split(",").map((h) => h.trim()).filter(Boolean);

      const res = await fetch(`/api/posts/${editPost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: editCaption,
          hashtags: updatedHashtags,
          media_url: editMediaUrl,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const savedPost: Post = {
        ...editPost,
        caption: editCaption,
        hashtags: updatedHashtags,
        media_url: editMediaUrl,
        status: newStatus,
      };
      setPosts((prev) => prev.map((p) => (p.id === editPost.id ? savedPost : p)));
      setEditPost(null);
      setSaving(false);
      handlePublish(savedPost);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  // Group by project
  const byProject = new Map<string, { name: string; posts: Post[] }>();
  for (const post of posts) {
    if (!byProject.has(post.project_id)) {
      byProject.set(post.project_id, { name: post.project_name, posts: [] });
    }
    byProject.get(post.project_id)!.posts.push(post);
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center gap-4">
        <CheckCircle className="h-10 w-10 text-muted-foreground/40" />
        <div>
          <p style={{ fontSize: "18px", fontWeight: 600, color: "rgba(0,0,0,0.85)", margin: 0 }}>{t.dashboard.nothingScheduled}</p>
          <p style={{ fontSize: "16px", color: "#615d59", marginTop: "8px" }}>
            {t.dashboard.checkProjects}{" "}
            <Link href="/projects" className="underline underline-offset-2 text-foreground hover:text-primary transition-colors">
              {t.dashboard.projects}
            </Link>{" "}
            {t.dashboard.toPlан}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {Array.from(byProject.entries()).map(([projectId, { name, posts: projectPosts }]) => (
        <div key={projectId} className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.3px", color: "rgba(0,0,0,0.9)", margin: 0 }}>{name}</h2>
            <Link
              href={`/projects/${projectId}`}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {t.dashboard.openProject} →
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            {projectPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 hover:border-border/80 transition-colors"
              >
                <span className="w-12 shrink-0 tabular-nums font-medium" style={{ fontSize: "14px", color: "#a39e98" }}>
                  {post.scheduled_time ? post.scheduled_time.slice(0, 5) : "—"}
                </span>

                <Badge
                  variant="outline"
                  className={`shrink-0 capitalize font-semibold px-2.5 py-1 text-xs ${PLATFORM_COLORS[post.platform] ?? ""}`}
                >
                  {post.platform}
                </Badge>

                <Badge variant="outline" className="shrink-0 capitalize text-xs font-normal px-2.5 py-1">
                  {post.post_type}
                </Badge>

                <p className="flex-1 min-w-0 truncate" style={{ fontSize: "15px", color: "#615d59" }}>
                  {post.caption}
                </p>

                <Badge
                  className={`shrink-0 font-semibold px-2.5 py-1 text-xs capitalize ${STATUS_COLORS[post.status] ?? ""}`}
                >
                  {post.status.replace("_", " ")}
                </Badge>

                <div className="shrink-0 flex items-center gap-0.5">
                  {["draft", "pending", "failed"].includes(post.status) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      title={t.dashboard.editAndPublish}
                      onClick={() => openEdit(post)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {post.status === "media_ready" && PUBLISH_ENDPOINTS[post.platform] && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title={t.dashboard.editAndPublish}
                        onClick={() => openEdit(post)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-primary hover:text-primary hover:bg-primary/10"
                        disabled={publishingId === post.id}
                        onClick={() => handlePublish(post)}
                        title={t.dashboard.publishNow}
                      >
                        {publishingId === post.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Edit / upload / publish modal */}
      <Dialog open={!!editPost} onOpenChange={(open) => { if (!open) setEditPost(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.dashboard.editAndPublish}</DialogTitle>
          </DialogHeader>

          {editPost && (
            <div className="flex flex-col gap-4 pt-2">
              {modalError && (
                <Alert variant="destructive">
                  <AlertDescription>{modalError}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={`capitalize ${PLATFORM_COLORS[editPost.platform] ?? ""}`}
                >
                  {editPost.platform}
                </Badge>
                <Badge variant="outline" className="capitalize">{editPost.post_type}</Badge>
                <Badge className={`capitalize ${STATUS_COLORS[editPost.status] ?? ""}`}>
                  {editPost.status.replace("_", " ")}
                </Badge>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="today-caption">{t.dashboard.caption}</Label>
                <Textarea
                  id="today-caption"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={5}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="today-hashtags">{t.dashboard.hashtags}</Label>
                <Input
                  id="today-hashtags"
                  value={editHashtags}
                  onChange={(e) => setEditHashtags(e.target.value)}
                  placeholder="event2026, volleyball, sportscamp"
                />
              </div>

              <div className="grid gap-2">
                <Label>{t.dashboard.media}</Label>
                {editPost.media_spec && (
                  <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground mb-1">
                    {t.dashboard.required}: {editPost.media_spec.type} · {editPost.media_spec.ratio} ·{" "}
                    {editPost.media_spec.resolution} · max {editPost.media_spec.max_size_mb} MB
                    {editPost.media_spec.duration_seconds
                      ? ` · ${editPost.media_spec.duration_seconds}s`
                      : ""}
                  </div>
                )}
                {editMediaUrl ? (
                  <div className="flex flex-col gap-2">
                    {editMediaMime?.startsWith("video") ||
                    editMediaUrl.match(/\.(mp4|mov|webm)$/i) ? (
                      <video
                        src={editMediaUrl}
                        controls
                        className="w-full rounded-md max-h-48 object-contain bg-black"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={editMediaUrl}
                        alt="Media preview"
                        className="w-full rounded-md max-h-48 object-contain bg-muted"
                      />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => { setEditMediaUrl(null); setEditMediaMime(null); }}
                    >
                      <X className="mr-2 h-3.5 w-3.5" />
                      {t.dashboard.removeMedia}
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-sm text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />{t.dashboard.uploading}</>
                    ) : (
                      <><Upload className="h-4 w-4" />{t.dashboard.clickToUpload}</>
                    )}
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
                  className="hidden"
                  onChange={handleMediaUpload}
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => setEditPost(null)}>
                  {t.dashboard.cancel}
                </Button>
                <Button onClick={handleSave} disabled={saving || uploading}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t.dashboard.save}
                </Button>
                {PUBLISH_ENDPOINTS[editPost.platform] && (
                  <Button
                    variant="default"
                    className="bg-primary hover:bg-primary/90"
                    disabled={saving || uploading || publishingId === editPost.id}
                    onClick={handleSaveAndPublish}
                  >
                    {publishingId === editPost.id ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.dashboard.publishing}</>
                    ) : (
                      <><Send className="mr-2 h-4 w-4" />{t.dashboard.publishNow}</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
