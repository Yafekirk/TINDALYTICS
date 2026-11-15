import type { Metadata } from "next";
import { Suspense } from "react";
import { AiDataPanels } from "@/components/ai-insights/ai-data-panels";
import { AiInsightsPanel } from "@/components/ai-insights/ai-insights-panel";
import { AiSnapshotCards } from "@/components/ai-insights/ai-snapshot-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { getOpenAiConfig } from "@/lib/ai/env";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { getAiInsightsSnapshot } from "@/lib/services/ai-insights";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: "AI Insights" };

async function AiInsightsContent() {
  const { store } = await getCurrentStoreContext();

  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  const snapshot = await getAiInsightsSnapshot(store.id, store.name);
  const openAi = getOpenAiConfig();

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold text-navy">AI Insights</h2>
        <p className="mt-1 text-sm text-secondary">
          Forecasts, restocking ideas, and business summaries grounded in your
          live store metrics for {snapshot.rangeLabel.toLowerCase()}.
        </p>
      </section>

      <AiSnapshotCards snapshot={snapshot} />

      <AiInsightsPanel
        snapshot={snapshot}
        initiallyConfigured={openAi.configured}
      />

      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold text-navy">
            Live store evidence
          </h3>
          <p className="text-sm text-secondary">
            These panels always use database records — not AI guesses.
          </p>
        </div>
        <AiDataPanels snapshot={snapshot} />
      </section>
    </div>
  );
}

export default function AiInsightsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      }
    >
      <AiInsightsContent />
    </Suspense>
  );
}
