"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export function ProjectsPageContent({ projects }: { projects: Project[] }) {
  const { t } = useLanguage();

  return (
    <div className="app-page flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t.projects.heading}</h1>
          <p className="text-muted-foreground">{t.projects.subtitle}</p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            {t.projects.newProject}
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-16 text-center">
          <h3 className="text-lg font-medium">{t.projects.noProjects}</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">{t.projects.noProjectsSub}</p>
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              {t.projects.newProject}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:border-foreground/30 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    <Badge variant={project.status === "active" ? "default" : "secondary"}>
                      {project.status}
                    </Badge>
                  </div>
                  <CardDescription>{project.event_name}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground flex flex-col gap-2">
                  <span>
                    {t.projects.eventDate}:{" "}
                    {new Date(project.event_date).toLocaleDateString(t.dateLocale)}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {project.platforms?.map((p: string) => (
                      <Badge key={p} variant="outline" className="text-xs capitalize">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
