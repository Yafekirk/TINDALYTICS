import { z } from "zod";
import type { AiGeneratedInsights } from "@/types/ai-insights";

export const aiGeneratedInsightsSchema = z.object({
  summary: z.string().trim().min(1).max(1200),
  salesForecast: z.object({
    outlook: z.string().trim().min(1).max(600),
    expectedChangePercent: z.number().finite().nullable(),
    confidence: z.enum(["low", "medium", "high"]),
    rationale: z.string().trim().min(1).max(800),
  }),
  inventoryRecommendations: z
    .array(
      z.object({
        productName: z.string().trim().min(1).max(160),
        action: z.enum(["restock", "reduce", "monitor", "promote"]),
        reason: z.string().trim().min(1).max(500),
        priority: z.enum(["high", "medium", "low"]),
      }),
    )
    .max(8),
  bestSellingAnalysis: z.string().trim().min(1).max(1000),
  slowMovingAnalysis: z.string().trim().min(1).max(1000),
  restockingRecommendations: z
    .array(
      z.object({
        productName: z.string().trim().min(1).max(160),
        suggestion: z.string().trim().min(1).max(500),
      }),
    )
    .max(8),
  insights: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(120),
        detail: z.string().trim().min(1).max(600),
        category: z.enum([
          "sales",
          "inventory",
          "profit",
          "customers",
          "general",
        ]),
      }),
    )
    .max(6),
});

export function parseAiGeneratedInsights(
  value: unknown,
):
  | { success: true; data: AiGeneratedInsights }
  | { success: false; error: string } {
  const parsed = aiGeneratedInsightsSchema.safeParse(value);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid AI response shape",
    };
  }
  return { success: true, data: parsed.data };
}

export function inventoryActionLabel(action: string) {
  const labels: Record<string, string> = {
    restock: "Restock",
    reduce: "Reduce stock",
    monitor: "Monitor",
    promote: "Promote",
  };
  return labels[action] ?? action;
}

export function insightCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    sales: "Sales",
    inventory: "Inventory",
    profit: "Profit",
    customers: "Customers",
    general: "General",
  };
  return labels[category] ?? category;
}
