import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";
import { buildChatSystemPrompt } from "@/lib/ai/chat-prompt";
import { createStoreChatTools } from "@/lib/ai/chat-tools";
import { getAiProviderConfig } from "@/lib/ai/provider";
import { getCurrentStoreContext } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const { store } = await getCurrentStoreContext();
    if (!store) {
      return NextResponse.json(
        { error: "No store found for this account." },
        { status: 400 },
      );
    }

    const config = getAiProviderConfig();
    if (!config.configured) {
      return NextResponse.json(
        {
          error:
            config.message ??
            "No AI provider configured. Add GOOGLE_GENERATIVE_AI_API_KEY for free Gemini.",
        },
        { status: 503 },
      );
    }

    const body = (await req.json()) as { messages?: UIMessage[] };
    const messages = body.messages ?? [];
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required." },
        { status: 400 },
      );
    }

    const tools = createStoreChatTools(store.id, store.name);

    const result = streamText({
      model: config.languageModel,
      system: buildChatSystemPrompt(store.name),
      messages: await convertToModelMessages(messages),
      tools,
      // Keep tool loops short — each Gemini step adds noticeable latency on free tier.
      stopWhen: isStepCount(2),
      temperature: 0.3,
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        onError(error) {
          const message =
            error instanceof Error ? error.message : String(error);
          console.error("POST /api/ai/chat stream:", message);
          if (/credit|quota|billing|insufficient/i.test(message)) {
            return config.provider === "gemini"
              ? "Gemini free quota was exceeded for now. Wait a bit and try again, or check AI Studio usage limits."
              : "OpenAI has no credits left. Add billing credits, or switch to free Gemini with GOOGLE_GENERATIVE_AI_API_KEY.";
          }
          return message || "Unable to process chat message.";
        },
      }),
    });
  } catch (error) {
    console.error("POST /api/ai/chat:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Unable to process chat message.";
    return NextResponse.json(
      {
        error: /credit|quota|billing|insufficient/i.test(message)
          ? "AI provider quota exceeded. For free usage, add GOOGLE_GENERATIVE_AI_API_KEY from Google AI Studio."
          : message,
      },
      { status: 500 },
    );
  }
}
