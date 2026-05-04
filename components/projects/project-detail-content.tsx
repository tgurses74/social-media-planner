"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { ContentPlan } from "@/components/projects/content-plan";
import { ProjectActions } from "@/components/projects/project-actions";
import { MetaAdsPlan } from "@/components/projects/meta-ads-plan";

interface Document {
  id: string;
  filename: string;
  file_url: string;
  size_bytes: number;
}

interface Post {
  id: string;
  scheduled_date: string;
  scheduled_time: string | null;
  platform: string;
  post_type: string;
  caption: string;
  hashtags: string[] | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  media_spec: any;
  media_url: string | null;
  status: string;
}

interface Project {
  id: string;
  name: string;
  event_name: string;
  event_date: string;
  status: string;
  platforms: string[];
  description: string | null;
  language: string;
  timeframe_start: string;
  timeframe_end: string;
  event_documents: Document[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta_ads_plan: any | null;
}

const SHADOW = "rgba(0,0,0,0.04) 0px 4px 18px, rgba(0,0,0,0.027) 0px 2.025px 7.85px, rgba(0,0,0,0.02) 0px 0.8px 2.93px, rgba(0,0,0,0.01) 0px 0.175px 1.04px";

export function ProjectDetailContent({
  project,
  posts,
}: {
  project: Project;
  posts: Post[];
}) {
  const { t } = useLanguage();

  return (
    <div className="app-page" style={{ display: "flex", flexDirection: "column", gap: "28px", padding: "48px 48px 64px" }}>
      {/* Back link */}
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 h-8 text-muted-foreground hover:text-foreground">
          <Link href="/projects">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            {t.projectDetail.backToProjects}
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 40px)", fontWeight: 700, letterSpacing: "-1px", color: "rgba(0,0,0,0.95)", lineHeight: 1.15, margin: 0, overflowWrap: "break-word" }}>
            {project.name}
          </h1>
          <p style={{ fontSize: "17px", color: "#615d59", margin: "10px 0 0" }}>{project.event_name}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "6px", flexShrink: 0 }}>
          <span style={{
            fontSize: "13px", fontWeight: 600, padding: "5px 14px", borderRadius: "9999px",
            background: project.status === "active" ? "#f2f9ff" : "#f6f5f4",
            color: project.status === "active" ? "#0075de" : "#615d59",
          }}>
            {project.status}
          </span>
          <ProjectActions project={project} />
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: "16px" }}>
        <div style={{ borderRadius: "12px", border: "1px solid rgba(0,0,0,0.09)", background: "#fafaf9", padding: "18px 22px", boxShadow: SHADOW }}>
          <p style={{ fontSize: "13px", color: "#a39e98", marginBottom: "6px", fontWeight: 500 }}>{t.projectDetail.eventDate}</p>
          <p style={{ fontSize: "16px", fontWeight: 600, color: "rgba(0,0,0,0.88)", margin: 0 }}>
            {new Date(project.event_date + "T12:00:00").toLocaleDateString(t.dateLocale, {
              day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        </div>
        <div style={{ borderRadius: "12px", border: "1px solid rgba(0,0,0,0.09)", background: "#fafaf9", padding: "18px 22px", boxShadow: SHADOW }}>
          <p style={{ fontSize: "13px", color: "#a39e98", marginBottom: "6px", fontWeight: 500 }}>{t.projectDetail.postingWindow}</p>
          <p style={{ fontSize: "16px", fontWeight: 600, color: "rgba(0,0,0,0.88)", margin: 0 }}>
            {new Date(project.timeframe_start + "T12:00:00").toLocaleDateString(t.dateLocale)} →{" "}
            {new Date(project.timeframe_end + "T12:00:00").toLocaleDateString(t.dateLocale)}
          </p>
        </div>
        <div style={{ borderRadius: "12px", border: "1px solid rgba(0,0,0,0.09)", background: "#fafaf9", padding: "18px 22px", boxShadow: SHADOW }}>
          <p style={{ fontSize: "13px", color: "#a39e98", marginBottom: "8px", fontWeight: 500 }}>{t.projectDetail.platforms}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {project.platforms?.map((p: string) => (
              <span key={p} style={{
                fontSize: "13px", fontWeight: 500, padding: "3px 10px", borderRadius: "9999px",
                background: "#f6f5f4", color: "#615d59", textTransform: "capitalize",
              }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <div style={{ borderRadius: "12px", border: "1px solid rgba(0,0,0,0.09)", background: "#fafaf9", padding: "20px 24px", boxShadow: SHADOW }}>
          <p style={{ fontSize: "13px", color: "#a39e98", marginBottom: "10px", fontWeight: 500 }}>{t.projectDetail.description}</p>
          <p style={{ fontSize: "15px", color: "rgba(0,0,0,0.82)", lineHeight: 1.65, margin: 0 }}>{project.description}</p>
        </div>
      )}

      {/* Documents */}
      {project.event_documents?.length > 0 && (
        <div style={{ borderRadius: "12px", border: "1px solid rgba(0,0,0,0.09)", background: "#fafaf9", padding: "20px 24px", boxShadow: SHADOW }}>
          <p style={{ fontSize: "13px", color: "#a39e98", marginBottom: "12px", fontWeight: 500 }}>{t.projectDetail.documents}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {project.event_documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", color: "rgba(0,0,0,0.85)", textDecoration: "none" }}
                className="hover:underline"
              >
                <FileText style={{ width: "16px", height: "16px", color: "#a39e98", flexShrink: 0 }} />
                {doc.filename}
                <span style={{ fontSize: "13px", color: "#a39e98" }}>
                  ({Math.round(doc.size_bytes / 1024)} KB)
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Meta Ads Proposal */}
      <MetaAdsPlan projectId={project.id} initialPlan={project.meta_ads_plan ?? null} />

      {/* Content plan */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.5px", color: "rgba(0,0,0,0.92)", margin: 0 }}>
          {t.projectDetail.contentPlan}
        </h2>
        <ContentPlan projectId={project.id} initialPosts={posts} />
      </div>
    </div>
  );
}
