import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LandingPage from "./landing-a/page";

export const metadata: Metadata = {
  title: "SM Planner — Plan and publish without the chaos",
  description:
    "SM Planner helps solo creators and small teams schedule and publish content across Instagram, Facebook, LinkedIn, and TikTok — from one calm workspace.",
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) redirect("/dashboard");

  return <LandingPage />;
}
