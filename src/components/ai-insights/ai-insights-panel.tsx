"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  Bot,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { generateStoreAiInsightsAction } from "@/lib/ai/actions";
import {
  insightCategoryLabel,
  inventoryActionLabel,
} from "@/lib/validations/ai-insights";
import type {
  AiGeneratedInsights,
  AiInsightsResponse,
  AiInsightsSnapshot,
} from "@/types/ai-insights";

type AiInsightsPanelProps = {
  snapshot: AiInsightsSnapshot;
  initiallyConfigured: boolean;
};

function StatusBanner({
  tone,
  title,
  message,
}: {
  tone: "warning" | "danger" | "info";
  title: string;
  message: string;
}) {
  const styles = {
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    danger: "border-red-200 bg-red-50 text-red-800",
    info: "border-sky-200 bg-sky-50 text-sky-900",
  } as const;

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${styles[tone]}`}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 opacity-90">{message}</p>
        </div>
      </div>
    </div>
  );
}

function InsightsResult({
  insights,
  model,
}: {
  insights: AiGeneratedInsights;
  model: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="info">AI-generated</Badge>
        <Badge tone="default">Model: {model}</Badge>
        <p className="text-xs text-secondary">
          Review recommendations before changing stock or pricing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Business summary</CardTitle>
            <CardDescription>
              Plain-language overview of recent performance.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-navy whitespace-pre-wrap">
            {insights.summary}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Sales forecast</CardTitle>
              <CardDescription>
                Near-term outlook based on recent store data.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                tone={
                  insights.salesForecast.confidence === "high"
                    ? "success"
                    : insights.salesForecast.confidence === "medium"
                      ? "warning"
                      : "default"
                }
              >
                Confidence: {insights.salesForecast.confidence}
              </Badge>
              {insights.salesForecast.expectedChangePercent != null ? (
                <Badge tone="info">
                  Expected change:{" "}
                  {insights.salesForecast.expectedChangePercent > 0 ? "+" : ""}
                  {insights.salesForecast.expectedChangePercent}%
                </Badge>
              ) : null}
            </div>
            <p className="font-medium text-navy">
              {insights.salesForecast.outlook}
            </p>
            <p className="text-secondary whitespace-pre-wrap">
              {insights.salesForecast.rationale}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Product analysis</CardTitle>
              <CardDescription>
                Best sellers and slow movers explained.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="mb-1 font-medium text-navy">Best sellers</p>
              <p className="text-secondary whitespace-pre-wrap">
                {insights.bestSellingAnalysis}
              </p>
            </div>
            <div>
              <p className="mb-1 font-medium text-navy">Slow movers</p>
              <p className="text-secondary whitespace-pre-wrap">
                {insights.slowMovingAnalysis}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Inventory recommendations</CardTitle>
              <CardDescription>
                Suggested stock actions from current levels and sales.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.inventoryRecommendations.length === 0 ? (
              <p className="text-sm text-secondary">
                No inventory recommendations for this period.
              </p>
            ) : (
              insights.inventoryRecommendations.map((item) => (
                <div
                  key={`${item.productName}-${item.action}`}
                  className="rounded-xl border border-border bg-slate-50/70 px-3 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-navy">{item.productName}</p>
                    <Badge
                      tone={
                        item.priority === "high"
                          ? "danger"
                          : item.priority === "medium"
                            ? "warning"
                            : "default"
                      }
                    >
                      {item.priority}
                    </Badge>
                    <Badge tone="info">
                      {inventoryActionLabel(item.action)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-secondary">{item.reason}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Restocking suggestions</CardTitle>
              <CardDescription>
                What to prepare before the next busy period.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.restockingRecommendations.length === 0 ? (
              <p className="text-sm text-secondary">
                No restocking suggestions right now.
              </p>
            ) : (
              insights.restockingRecommendations.map((item) => (
                <div
                  key={`${item.productName}-${item.suggestion.slice(0, 24)}`}
                  className="rounded-xl border border-border px-3 py-3"
                >
                  <p className="font-medium text-navy">{item.productName}</p>
                  <p className="mt-1 text-sm text-secondary">
                    {item.suggestion}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Key insights</CardTitle>
            <CardDescription>
              Short takeaways labeled as AI-generated guidance.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {insights.insights.map((item) => (
            <div
              key={`${item.title}-${item.category}`}
              className="rounded-xl border border-border bg-white px-3 py-3"
            >
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <p className="font-medium text-navy">{item.title}</p>
                <Badge tone="default">
                  {insightCategoryLabel(item.category)}
                </Badge>
              </div>
              <p className="text-sm text-secondary">{item.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function AiInsightsPanel({
  snapshot,
  initiallyConfigured,
}: AiInsightsPanelProps) {
  const [result, setResult] = useState<AiInsightsResponse | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      const response = await generateStoreAiInsightsAction();
      setResult(response);
    });
  }

  const activeSnapshot = result?.snapshot ?? snapshot;
  const showUnconfigured =
    (result?.status === "unconfigured" ||
      (!result && !initiallyConfigured)) ??
    false;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI business insights
            </CardTitle>
            <CardDescription>
              Uses your live {activeSnapshot.rangeLabel.toLowerCase()} store
              data. AI output is labeled and validated before display.
            </CardDescription>
          </div>
          <Button onClick={handleGenerate} disabled={isPending}>
            {isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Bot className="h-4 w-4" />
                {result?.status === "ok" ? "Regenerate insights" : "Generate AI insights"}
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showUnconfigured ? (
            <StatusBanner
              tone="warning"
              title="OpenAI API key required"
              message={
                result?.status === "unconfigured"
                  ? result.message
                  : "Add OPENAI_API_KEY to .env.local to enable AI analysis. Metrics and tables on this page still reflect your real store data."
              }
            />
          ) : null}

          {result?.status === "insufficient_data" ? (
            <StatusBanner
              tone="info"
              title="Insufficient sales history"
              message={result.message}
            />
          ) : null}

          {result?.status === "error" ? (
            <StatusBanner
              tone="danger"
              title="AI generation failed"
              message={result.message}
            />
          ) : null}

          {activeSnapshot.dataNotes.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-xs text-secondary">
              {activeSnapshot.dataNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}

          {!result && initiallyConfigured ? (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-secondary">
              Click <span className="font-medium text-navy">Generate AI insights</span>{" "}
              to analyze your current store metrics with OpenAI.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {result?.status === "ok" ? (
        <InsightsResult insights={result.insights} model={result.model} />
      ) : null}
    </div>
  );
}
