"use client";

import { NewProjectForm } from "@/components/projects/new-project-form";
import { useLanguage } from "@/lib/i18n/language-context";

export default function NewProjectPage() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t.newProject.heading}</h1>
        <p className="text-muted-foreground">{t.newProject.subtitle}</p>
      </div>
      <NewProjectForm />
    </div>
  );
}
