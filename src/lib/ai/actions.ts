"use server";

import { generateAiInsights } from "@/lib/ai/generate-insights";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { getAiInsightsSnapshot } from "@/lib/services/ai-insights";
import type { AiInsightsResponse } from "@/types/ai-insights";

export async function generateStoreAiInsightsAction(): Promise<AiInsightsResponse> {
  const { store } = await getCurrentStoreContext();
  if (!store) {
    return {
      status: "error",
      message: "No store found for this account.",
      snapshot: {
        storeName: "Unknown",
        rangeLabel: "Last 30 days",
        generatedAt: new Date().toISOString(),
        hasEnoughData: false,
        dataNotes: ["Store setup needed."],
        summary: {
          revenue: 0,
          transactions: 0,
          averageTicket: 0,
          grossProfit: 0,
          expenses: 0,
          netProfit: 0,
          itemsSold: 0,
        },
        recentTrend: [],
        weekdaySales: [],
        bestSellers: [],
        slowMoving: [],
        lowStock: [],
        categorySales: [],
      },
    };
  }

  const snapshot = await getAiInsightsSnapshot(store.id, store.name);
  return generateAiInsights(snapshot);
}
