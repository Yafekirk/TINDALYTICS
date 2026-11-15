import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type AiProviderName = "gemini" | "openai";

export type AiProviderConfig =
  | {
      configured: true;
      provider: AiProviderName;
      model: string;
      languageModel: LanguageModel;
    }
  | {
      configured: false;
      message: string;
    };

/**
 * Prefer free Gemini (Google AI Studio) when configured.
 * Falls back to OpenAI if only OPENAI_API_KEY is set.
 */
export function getAiProviderConfig(): AiProviderConfig {
  const geminiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    "";
  // Flash-Lite is faster/cheaper on free tier; override with GEMINI_MODEL if needed.
  const geminiModel =
    process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";

  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    return {
      configured: true,
      provider: "gemini",
      model: geminiModel,
      languageModel: google(geminiModel),
    };
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim() || "";
  const openaiModel = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  if (openaiKey) {
    const openai = createOpenAI({ apiKey: openaiKey });
    return {
      configured: true,
      provider: "openai",
      model: openaiModel,
      languageModel: openai(openaiModel),
    };
  }

  return {
    configured: false,
    message:
      "No AI provider configured. Add a free GOOGLE_GENERATIVE_AI_API_KEY from Google AI Studio (recommended), or OPENAI_API_KEY. Store metrics still come from your live database.",
  };
}
