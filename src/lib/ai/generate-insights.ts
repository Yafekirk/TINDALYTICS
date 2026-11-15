import { createOpenAiJsonCompletion } from "@/lib/ai/openai";
import { getOpenAiConfig } from "@/lib/ai/env";
import { parseAiGeneratedInsights } from "@/lib/validations/ai-insights";
import type {
  AiInsightsResponse,
  AiInsightsSnapshot,
} from "@/types/ai-insights";

function buildSystemPrompt() {
  return `You are Tindalytics, an AI assistant for Filipino sari-sari store owners.
Analyze ONLY the provided store metrics JSON. Do not invent products, sales numbers, or stock levels that are not in the data.
If data is thin, say so clearly and lower confidence.
Write in clear, practical English that a non-technical store owner can understand.
Return a single JSON object with this exact shape:
{
  "summary": string,
  "salesForecast": {
    "outlook": string,
    "expectedChangePercent": number | null,
    "confidence": "low" | "medium" | "high",
    "rationale": string
  },
  "inventoryRecommendations": [
    {
      "productName": string,
      "action": "restock" | "reduce" | "monitor" | "promote",
      "reason": string,
      "priority": "high" | "medium" | "low"
    }
  ],
  "bestSellingAnalysis": string,
  "slowMovingAnalysis": string,
  "restockingRecommendations": [
    { "productName": string, "suggestion": string }
  ],
  "insights": [
    {
      "title": string,
      "detail": string,
      "category": "sales" | "inventory" | "profit" | "customers" | "general"
    }
  ]
}
Keep arrays short (max 6-8). Prefer actionable advice for a small Philippine retail store.`;
}

function buildUserPrompt(snapshot: AiInsightsSnapshot) {
  return `Store: ${snapshot.storeName}
Period: ${snapshot.rangeLabel}
Generated at: ${snapshot.generatedAt}

Store metrics JSON:
${JSON.stringify(snapshot, null, 2)}

Produce the JSON insights now.`;
}

export async function generateAiInsights(
  snapshot: AiInsightsSnapshot,
): Promise<AiInsightsResponse> {
  const config = getOpenAiConfig();

  if (!config.configured) {
    return {
      status: "unconfigured",
      message: config.message,
      snapshot,
    };
  }

  if (!snapshot.hasEnoughData) {
    return {
      status: "insufficient_data",
      message:
        "Not enough recent sales to generate a reliable AI analysis. Complete a few more transactions, then try again. The metrics below are still from your live store data.",
      snapshot,
    };
  }

  const completion = await createOpenAiJsonCompletion({
    apiKey: config.apiKey,
    model: config.model,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(snapshot) },
    ],
  });

  if ("error" in completion) {
    return {
      status: "error",
      message: completion.error,
      snapshot,
    };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(completion.content);
  } catch {
    return {
      status: "error",
      message: "AI returned invalid JSON. Please try generating again.",
      snapshot,
    };
  }

  const validated = parseAiGeneratedInsights(parsedJson);
  if (!validated.success) {
    return {
      status: "error",
      message: `AI response validation failed: ${validated.error}`,
      snapshot,
    };
  }

  return {
    status: "ok",
    source: "openai",
    model: config.model,
    snapshot,
    insights: validated.data,
  };
}
