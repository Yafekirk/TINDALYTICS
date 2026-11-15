import { generateText } from "ai";
import { getAiProviderConfig } from "@/lib/ai/provider";
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

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      return JSON.parse(fenced[1].trim());
    }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("No JSON object found in model response.");
  }
}

export async function generateAiInsights(
  snapshot: AiInsightsSnapshot,
): Promise<AiInsightsResponse> {
  const config = getAiProviderConfig();

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

  try {
    const result = await generateText({
      model: config.languageModel,
      temperature: 0.3,
      system: buildSystemPrompt(),
      prompt: buildUserPrompt(snapshot),
    });

    const content = result.text?.trim();
    if (!content) {
      return {
        status: "error",
        message: "AI returned an empty response.",
        snapshot,
      };
    }

    let parsedJson: unknown;
    try {
      parsedJson = extractJsonObject(content);
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
      source: config.provider,
      model: config.model,
      snapshot,
      insights: validated.data,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to generate AI insights.";
    return {
      status: "error",
      message,
      snapshot,
    };
  }
}
