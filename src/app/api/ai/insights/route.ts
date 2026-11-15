import { NextResponse } from "next/server";
import { generateAiInsights } from "@/lib/ai/generate-insights";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { getAiInsightsSnapshot } from "@/lib/services/ai-insights";

export async function POST() {
  try {
    const { store } = await getCurrentStoreContext();
    if (!store) {
      return NextResponse.json(
        { status: "error", message: "No store found for this account." },
        { status: 400 },
      );
    }

    const snapshot = await getAiInsightsSnapshot(store.id, store.name);
    const result = await generateAiInsights(snapshot);
    const httpStatus =
      result.status === "ok"
        ? 200
        : result.status === "unconfigured" ||
            result.status === "insufficient_data"
          ? 200
          : 502;

    return NextResponse.json(result, { status: httpStatus });
  } catch (error) {
    console.error("POST /api/ai/insights:", error);
    return NextResponse.json(
      {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to generate AI insights.",
      },
      { status: 500 },
    );
  }
}
