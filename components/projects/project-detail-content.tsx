"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { ContentPlan } from "@/components/projects/content-plan";
import { ProjectActions } from "@/components/projects/project-actions";

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
}

export function ProjectDetailContent({
  project,
  posts,
}: {
  project: Project;
  posts: Post[];
}) {
  const { t } = useLanguage();

  return (
    <div className="app-page flex flex-col gap-6 p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.projectDetail.backToProjects}
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight break-words">{project.name}</h1>
          <p className="text-lg text-muted-foreground">{project.event_name}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge variant={project.status === "active" ? "default" : "secondary"}>
            {project.status}
          </Badge>
          <ProjectActions project={project} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.projectDetail.eventDate}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            {new Date(project.event_date + "T12:00:00").toLocaleDateString(t.dateLocale, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.projectDetail.postingWindow}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {new Date(project.timeframe_start + "T12:00:00").toLocaleDateString(t.dateLocale)} →{" "}
            {new Date(project.timeframe_end + "T12:00:00").toLocaleDateString(t.dateLocale)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.projectDetail.platforms}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {project.platforms?.map((p: string) => (
                <Badge key={p} variant="outline" className="capitalize">
                  {p}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {project.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.projectDetail.description}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{project.description}</CardContent>
        </Card>
      )}

      {project.event_documents?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.projectDetail.documents}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {project.event_documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:underline"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                {doc.filename}
                <span className="text-muted-foreground">
                  ({Math.round(doc.size_bytes / 1024)} KB)
                </span>
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">{t.projectDetail.contentPlan}</h2>
        <ContentPlan projectId={project.id} initialPosts={posts} />
      </div>
    </div>
  );
}
