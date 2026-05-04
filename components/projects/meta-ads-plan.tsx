"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Sparkles, RefreshCw, Calendar, Target, DollarSign, Megaphone, Tag } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

interface MetaAdsBudget {
  target_connections: number;
  budget_usd: number;
  daily_budget_usd: number;
  duration_days: number;
  strategy: string;
}

interface MetaAdsPlan {
  selected_post: {
    caption_preview: string;
    post_type: string;
    scheduled_date: string;
    rationale: string;
  };
  ad_time_window: {
    start: string;
    end: string;
    rationale: string;
  };
  keywords: string[];
  campaign_type: string;
  campaign_rationale: string;
  budgets: MetaAdsBudget[];
}

const SHADOW =
  "rgba(0,0,0,0.04) 0px 4px 18px, rgba(0,0,0,0.027) 0px 2.025px 7.85px, rgba(0,0,0,0.02) 0px 0.8px 2.93px, rgba(0,0,0,0.01) 0px 0.175px 1.04px";

const CAMPAIGN_COLORS: Record<string, string> = {
  BRAND_AWARENESS: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  REACH: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  TRAFFIC: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  ENGAGEMENT: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  LEAD_GENERATION: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  CONVERSIONS: "bg-green-500/10 text-green-600 border-green-500/20",
};

const BUDGET_LABELS = ["Starter", "Growth", "Scale"];

interface Props {
  projectId: string;
  initialPlan: MetaAdsPlan | null;
}

export function MetaAdsPlan({ projectId, initialPlan }: Props) {
  const { t } = useLanguage();
  const td = t.projectDetail;
  const [plan, setPlan] = useState<MetaAdsPlan | null>(initialPlan);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/generate-ads-plan`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlan(data.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.5px", color: "rgba(0,0,0,0.92)", margin: 0 }}>
            {td.metaAdsHeading}
          </h2>
          <p style={{ fontSize: "14px", color: "#a39e98", marginTop: "4px" }}>{td.metaAdsSubtitle}</p>
        </div>
        {plan && (
          <Button
            variant="outline"
            size="sm"
            disabled={generating}
            onClick={handleGenerate}
          >
            {generating ? (
              <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />{td.metaAdsGenerating}</>
            ) : (
              <><RefreshCw className="mr-1.5 h-3.5 w-3.5" />{td.metaAdsRegenerate}</>
            )}
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!plan ? (
        /* Empty state */
        <div
          style={{
            borderRadius: "16px",
            border: "1px dashed rgba(0,0,0,0.15)",
            background: "#fafaf9",
            padding: "48px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            textAlign: "center",
          }}
        >
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Megaphone style={{ width: "24px", height: "24px", color: "#a39e98" }} />
          </div>
          <div>
            <p style={{ fontSize: "17px", fontWeight: 600, color: "rgba(0,0,0,0.85)", margin: 0 }}>{td.metaAdsNoPlan}</p>
            <p style={{ fontSize: "14px", color: "#a39e98", marginTop: "6px" }}>{td.metaAdsNoPlanSub}</p>
          </div>
          <Button onClick={handleGenerate} disabled={generating} size="sm">
            {generating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{td.metaAdsGenerating}</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />{td.metaAdsGenerate}</>
            )}
          </Button>
        </div>
      ) : (
        /* Plan content */
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Row 1: Selected post + time window */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "16px" }}>
            {/* Selected post */}
            <div style={{ borderRadius: "14px", border: "1px solid rgba(0,0,0,0.09)", background: "#fafaf9", padding: "20px 22px", boxShadow: SHADOW }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(236,72,153,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Tag style={{ width: "14px", height: "14px", color: "#ec4899" }} />
                </div>
                <p style={{ fontSize: "12px", color: "#a39e98", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
                  {td.metaAdsSelectedPost}
                </p>
              </div>
              <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
                <Badge variant="outline" className="capitalize text-xs bg-pink-500/10 text-pink-600 border-pink-500/20">
                  instagram
                </Badge>
                <Badge variant="outline" className="capitalize text-xs">
                  {plan.selected_post.post_type}
                </Badge>
                <span style={{ fontSize: "12px", color: "#a39e98", alignSelf: "center" }}>
                  {new Date(plan.selected_post.scheduled_date + "T12:00:00").toLocaleDateString(t.dateLocale, { day: "numeric", month: "short" })}
                </span>
              </div>
              <p style={{ fontSize: "14px", color: "rgba(0,0,0,0.85)", lineHeight: 1.55, margin: "0 0 10px", fontStyle: "italic" }}>
                &ldquo;{plan.selected_post.caption_preview}&rdquo;
              </p>
              <p style={{ fontSize: "13px", color: "#615d59", lineHeight: 1.5, margin: 0 }}>
                {plan.selected_post.rationale}
              </p>
            </div>

            {/* Time window */}
            <div style={{ borderRadius: "14px", border: "1px solid rgba(0,0,0,0.09)", background: "#fafaf9", padding: "20px 22px", boxShadow: SHADOW }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Calendar style={{ width: "14px", height: "14px", color: "#3b82f6" }} />
                </div>
                <p style={{ fontSize: "12px", color: "#a39e98", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
                  {td.metaAdsTimeWindow}
                </p>
              </div>
              <p style={{ fontSize: "20px", fontWeight: 700, color: "rgba(0,0,0,0.88)", letterSpacing: "-0.3px", margin: "0 0 8px" }}>
                {new Date(plan.ad_time_window.start + "T12:00:00").toLocaleDateString(t.dateLocale, { day: "numeric", month: "short" })}
                {" → "}
                {new Date(plan.ad_time_window.end + "T12:00:00").toLocaleDateString(t.dateLocale, { day: "numeric", month: "short" })}
              </p>
              <p style={{ fontSize: "13px", color: "#615d59", lineHeight: 1.5, margin: 0 }}>
                {plan.ad_time_window.rationale}
              </p>
            </div>
          </div>

          {/* Row 2: Campaign type + keywords */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "16px" }}>
            {/* Campaign type */}
            <div style={{ borderRadius: "14px", border: "1px solid rgba(0,0,0,0.09)", background: "#fafaf9", padding: "20px 22px", boxShadow: SHADOW }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Target style={{ width: "14px", height: "14px", color: "#a855f7" }} />
                </div>
                <p style={{ fontSize: "12px", color: "#a39e98", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
                  {td.metaAdsCampaignType}
                </p>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <Badge
                  variant="outline"
                  className={`text-sm font-semibold px-3 py-1 ${CAMPAIGN_COLORS[plan.campaign_type] ?? "bg-muted text-muted-foreground"}`}
                >
                  {plan.campaign_type.replace(/_/g, " ")}
                </Badge>
              </div>
              <p style={{ fontSize: "13px", color: "#615d59", lineHeight: 1.5, margin: 0 }}>
                {plan.campaign_rationale}
              </p>
            </div>

            {/* Keywords */}
            <div style={{ borderRadius: "14px", border: "1px solid rgba(0,0,0,0.09)", background: "#fafaf9", padding: "20px 22px", boxShadow: SHADOW }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Sparkles style={{ width: "14px", height: "14px", color: "#f59e0b" }} />
                </div>
                <p style={{ fontSize: "12px", color: "#a39e98", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
                  {td.metaAdsKeywords}
                </p>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {plan.keywords.map((kw) => (
                  <span
                    key={kw}
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      padding: "3px 10px",
                      borderRadius: "9999px",
                      background: "rgba(245,158,11,0.1)",
                      color: "#b45309",
                    }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Budget scenarios */}
          <div style={{ borderRadius: "14px", border: "1px solid rgba(0,0,0,0.09)", background: "#fafaf9", padding: "20px 22px", boxShadow: SHADOW }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <DollarSign style={{ width: "14px", height: "14px", color: "#10b981" }} />
              </div>
              <p style={{ fontSize: "12px", color: "#a39e98", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
                {td.metaAdsBudgets}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: "12px" }}>
              {plan.budgets.map((budget, i) => (
                <div
                  key={budget.target_connections}
                  style={{
                    borderRadius: "10px",
                    border: "1px solid rgba(0,0,0,0.08)",
                    background: "#fff",
                    padding: "16px 18px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#a39e98", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {BUDGET_LABELS[i] ?? `Tier ${i + 1}`}
                    </span>
                    <span style={{ fontSize: "18px", fontWeight: 800, color: "rgba(0,0,0,0.88)", letterSpacing: "-0.5px" }}>
                      ${budget.budget_usd.toLocaleString()}
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#10b981", margin: "0 0 4px" }}>
                    {td.metaAdsConnections(budget.target_connections)}
                  </p>
                  <p style={{ fontSize: "12px", color: "#a39e98", margin: "0 0 10px" }}>
                    {td.metaAdsDailyBudget(budget.daily_budget_usd)} · {td.metaAdsDuration(budget.duration_days)}
                  </p>
                  <p style={{ fontSize: "13px", color: "#615d59", lineHeight: 1.5, margin: 0 }}>
                    {budget.strategy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
