"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Sparkles, Pencil, Trash2, RefreshCw, Upload, X, CheckCircle, Send } from "lucide-react";
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
  scheduled_date: string;
  scheduled_time: string | null;
  platform: string;
  post_type: string;
  caption: string;
  hashtags: string[] | null;
  media_spec: MediaSpec;
  media_url: string | null;
  status: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  instagram: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  linkedin: "bg-sky-600/10 text-sky-600 border-sky-600/20",
  tiktok: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-yellow-500/10 text-yellow-600",
  media_ready: "bg-blue-500/10 text-blue-600",
  published: "bg-green-500/10 text-green-600",
  failed: "bg-red-500/10 text-red-600",
};

const PLATFORM_ACCENT: Record<string, string> = {
  facebook: "#3b82f6",
  instagram: "#ec4899",
  linkedin: "#0ea5e9",
  tiktok: "#a855f7",
};

function groupByDate(posts: Post[]): Map<string, Post[]> {
  const map = new Map<string, Post[]>();
  for (const post of posts) {
    const key = post.scheduled_date;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(post);
  }
  return map;
}

export function ContentPlan({
  projectId,
  initialPosts,
}: {
  projectId: string;
  initialPosts: Post[];
}) {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [editCaption, setEditCaption] = useState("");
  const [editHashtags, setEditHashtags] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editMediaUrl, setEditMediaUrl] = useState<string | null>(null);
  const [editMediaMime, setEditMediaMime] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/generate-plan`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPosts(data.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  function openEdit(post: Post) {
    setEditPost(post);
    setEditCaption(post.caption);
    setEditHashtags((post.hashtags ?? []).join(", "));
    setEditDate(post.scheduled_date);
    setEditMediaUrl(post.media_url ?? null);
    setEditMediaMime(null);
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
      setError(err instanceof Error ? err.message : "Media upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveEdit() {
    if (!editPost) return;
    setSaving(true);
    try {
      const newStatus =
        editMediaUrl && editPost.status === "draft" ? "media_ready" : editPost.status;

      const res = await fetch(`/api/posts/${editPost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: editCaption,
          hashtags: editHashtags.split(",").map((h) => h.trim()).filter(Boolean),
          scheduled_date: editDate,
          media_url: editMediaUrl,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === editPost.id
            ? {
                ...p,
                caption: editCaption,
                hashtags: editHashtags.split(",").map((h) => h.trim()).filter(Boolean),
                scheduled_date: editDate,
                media_url: editMediaUrl,
                status: newStatus,
              }
            : p,
        ),
      );
      setEditPost(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndPublish() {
    if (!editPost) return;
    setSaving(true);
    setError(null);
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
          scheduled_date: editDate,
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
        scheduled_date: editDate,
        media_url: editMediaUrl,
        status: newStatus,
      };
      setPosts((prev) => prev.map((p) => (p.id === editPost.id ? savedPost : p)));
      setEditPost(null);
      setSaving(false);
      handlePublish(savedPost);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  async function handleMarkPending(post: Post) {
    const res = await fetch(`/api/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pending" }),
    });
    if (res.ok) {
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, status: "pending" } : p)),
      );
    }
  }

  async function handleDelete(postId: string) {
    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  async function handlePublish(post: Post) {
    setPublishingId(post.id);
    setError(null);
    try {
      const ENDPOINTS: Record<string, string> = {
        facebook: "/api/publish/meta",
        instagram: "/api/publish/meta",
        linkedin: "/api/publish/linkedin",
        tiktok: "/api/publish/tiktok",
      };
      const endpoint = ENDPOINTS[post.platform];
      if (!endpoint) throw new Error(`Publishing for ${post.platform} is not yet available.`);

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
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: "published" } : p)));
      setEditPost(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: "failed" } : p)));
    } finally {
      setPublishingId(null);
    }
  }

  const grouped = groupByDate(
    [...posts].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date)),
  );

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-16">
        {error && (
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Sparkles className="h-10 w-10 text-muted-foreground" />
        <div className="text-center">
          <p className="font-medium">{t.contentPlan.noPlan}</p>
          <p className="text-sm text-muted-foreground">{t.contentPlan.noPlanSub}</p>
        </div>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{t.contentPlan.generating}</>
          ) : (
            <><Sparkles className="mr-2 h-5 w-5" />{t.contentPlan.generate}</>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t.contentPlan.postsAcross(posts.length, grouped.size)}
        </p>
        <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{t.contentPlan.regenerating}</>
          ) : (
            <><RefreshCw className="mr-2 h-5 w-5" />{t.contentPlan.regenerate}</>
          )}
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {Array.from(grouped.entries()).map(([date, datePosts]) => (
          <div key={date} className="flex flex-col gap-2">
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-3 text-base font-bold uppercase tracking-widest text-muted-foreground">
              {new Date(date + "T12:00:00").toLocaleDateString(t.dateLocale, {
                weekday: "short",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
            <div className="flex flex-col gap-3">
              {datePosts.map((post) => (
                <div
                  key={post.id}
                  className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-md transition-shadow hover:shadow-lg"
                  style={{
                    borderLeftWidth: "5px",
                    borderLeftColor: PLATFORM_ACCENT[post.platform] ?? "#6366f1",
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Badge
                        variant="outline"
                        className={`capitalize text-xl font-bold px-3.5 py-1 ${PLATFORM_COLORS[post.platform] ?? ""}`}
                      >
                        {post.platform}
                      </Badge>
                      <Badge variant="outline" className="capitalize text-xl font-semibold px-3.5 py-1">
                        {post.post_type}
                      </Badge>
                      <Badge className={`capitalize text-xl font-semibold px-3.5 py-1 ${STATUS_COLORS[post.status] ?? ""}`}>
                        {post.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {post.status === "draft" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-11 w-11 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                          title={t.contentPlan.markPending}
                          onClick={() => handleMarkPending(post)}
                        >
                          <CheckCircle className="h-6 w-6" />
                        </Button>
                      )}
                      {["pending", "media_ready", "failed"].includes(post.status) &&
                        ["facebook", "instagram", "linkedin", "tiktok"].includes(post.platform) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-11 w-11 p-0 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary"
                            title={t.contentPlan.publishNow}
                            disabled={publishingId === post.id}
                            onClick={() => handlePublish(post)}
                          >
                            {publishingId === post.id ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Send className="h-5 w-5" />
                            )}
                          </Button>
                        )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-11 w-11 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                        title={t.contentPlan.edit}
                        onClick={() => openEdit(post)}
                      >
                        <Pencil className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-11 w-11 p-0 text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/10"
                        title={t.contentPlan.delete}
                        onClick={() => handleDelete(post.id)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-base leading-relaxed line-clamp-2 text-foreground">
                    {post.caption}
                  </p>

                  {post.hashtags && post.hashtags.length > 0 && (
                    <p className="text-base text-muted-foreground truncate">
                      {post.hashtags.map((h) => `#${h}`).join(" ")}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-base text-muted-foreground border-t border-border pt-3">
                    <span>
                      {post.media_spec.type} · {post.media_spec.ratio} · {post.media_spec.resolution}
                    </span>
                    {post.media_url && (
                      <span className="text-green-400 font-semibold">{t.contentPlan.mediaReady}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      <Dialog open={!!editPost} onOpenChange={(open) => { if (!open) setEditPost(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.contentPlan.editPost}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              {editPost && (
                <Badge variant="outline" className={`capitalize ${PLATFORM_COLORS[editPost.platform] ?? ""}`}>
                  {editPost.platform}
                </Badge>
              )}
              {editPost && (
                <Badge variant="outline" className="capitalize">{editPost.post_type}</Badge>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-date">{t.contentPlan.date}</Label>
              <Input
                id="edit-date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-caption">{t.contentPlan.caption}</Label>
              <Textarea
                id="edit-caption"
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                rows={5}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-hashtags">{t.contentPlan.hashtags}</Label>
              <Input
                id="edit-hashtags"
                value={editHashtags}
                onChange={(e) => setEditHashtags(e.target.value)}
                placeholder="event2026, volleyball, sportscamp"
              />
            </div>

            <div className="grid gap-2">
              <Label>{t.contentPlan.media}</Label>
              {editPost && (
                <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground mb-1">
                  {t.contentPlan.required}: {editPost.media_spec.type} · {editPost.media_spec.ratio} ·{" "}
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
                    {t.contentPlan.removeMedia}
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
                    <><Loader2 className="h-4 w-4 animate-spin" />{t.contentPlan.uploading}</>
                  ) : (
                    <><Upload className="h-4 w-4" />{t.contentPlan.clickToUpload}</>
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

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditPost(null)}>{t.contentPlan.cancel}</Button>
              <Button onClick={handleSaveEdit} disabled={saving || uploading}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.contentPlan.save}
              </Button>
              {editPost &&
                ["pending", "media_ready", "failed"].includes(editPost.status) &&
                ["facebook", "instagram", "linkedin", "tiktok"].includes(editPost.platform) && (
                  <Button
                    variant="default"
                    className="bg-primary hover:bg-primary/90"
                    disabled={saving || uploading || publishingId === editPost.id}
                    onClick={() => handleSaveAndPublish()}
                  >
                    {publishingId === editPost.id ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.contentPlan.publishing}</>
                    ) : (
                      <><Send className="mr-2 h-4 w-4" />{t.contentPlan.publishNowBtn}</>
                    )}
                  </Button>
                )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
