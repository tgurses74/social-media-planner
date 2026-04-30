"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

interface Project {
  id: string;
  name: string;
  event_name: string;
  event_date: string;
  status: string;
  platforms: string[];
}

const SHADOW = "rgba(0,0,0,0.04) 0px 4px 18px, rgba(0,0,0,0.027) 0px 2.025px 7.85px, rgba(0,0,0,0.02) 0px 0.8px 2.93px, rgba(0,0,0,0.01) 0px 0.175px 1.04px";
const SHADOW_HOVER = "rgba(0,0,0,0.07) 0px 8px 24px, rgba(0,0,0,0.05) 0px 4px 10px, rgba(0,0,0,0.03) 0px 1.5px 4px";

export function ProjectsPageContent({ projects }: { projects: Project[] }) {
  const { t } = useLanguage();

  return (
    <div className="app-page" style={{ padding: "48px 48px 64px", maxWidth: "1320px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "36px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 40px)", fontWeight: 700, letterSpacing: "-1px", color: "rgba(0,0,0,0.95)", lineHeight: 1.15, margin: 0 }}>
            {t.projects.heading}
          </h1>
          <p style={{ fontSize: "17px", color: "#615d59", margin: "10px 0 0" }}>
            {t.projects.subtitle}
          </p>
        </div>
        <Button asChild className="h-11 px-6 text-base font-semibold shrink-0">
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            {t.projects.newProject}
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <div style={{ border: "1.5px dashed rgba(0,0,0,0.15)", borderRadius: "14px", padding: "64px 24px", textAlign: "center", background: "#fafaf9" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>📁</div>
          <h3 style={{ fontSize: "20px", fontWeight: 600, color: "rgba(0,0,0,0.85)", margin: "0 0 10px" }}>
            {t.projects.noProjects}
          </h3>
          <p style={{ fontSize: "16px", color: "#615d59", margin: "0 0 28px" }}>
            {t.projects.noProjectsSub}
          </p>
          <Button asChild className="h-11 px-6 text-base font-semibold">
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              {t.projects.newProject}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" style={{ gap: "20px" }}>
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} style={{ textDecoration: "none" }}>
              <div
                style={{
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.1)",
                  borderRadius: "14px",
                  padding: "28px 32px",
                  boxShadow: SHADOW,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  cursor: "pointer",
                  transition: "box-shadow 0.15s ease, border-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.boxShadow = SHADOW_HOVER;
                  el.style.borderColor = "rgba(0,0,0,0.18)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.boxShadow = SHADOW;
                  el.style.borderColor = "rgba(0,0,0,0.1)";
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "14px" }}>
                  <span style={{ fontSize: "19px", fontWeight: 700, color: "rgba(0,0,0,0.92)", lineHeight: 1.3, letterSpacing: "-0.3px" }}>
                    {project.name}
                  </span>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    letterSpacing: "0.1px",
                    padding: "4px 11px",
                    borderRadius: "9999px",
                    background: project.status === "active" ? "#f2f9ff" : "#f6f5f4",
                    color: project.status === "active" ? "#0075de" : "#615d59",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    lineHeight: 1.6,
                  }}>
                    {project.status}
                  </span>
                </div>

                {project.event_name && (
                  <p style={{ fontSize: "15px", color: "#615d59", lineHeight: 1.5, margin: "10px 0 0" }}>
                    {project.event_name}
                  </p>
                )}

                <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                  <div style={{ fontSize: "14px", color: "#a39e98", marginBottom: "12px" }}>
                    {t.projects.eventDate}: {new Date(project.event_date).toLocaleDateString(t.dateLocale)}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {project.platforms?.map((p: string) => (
                      <span key={p} style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        padding: "4px 11px",
                        borderRadius: "9999px",
                        background: "#f6f5f4",
                        color: "#615d59",
                        textTransform: "capitalize" as const,
                      }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
