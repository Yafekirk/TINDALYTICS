export function getOpenAiConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  if (!apiKey) {
    return {
      configured: false as const,
      message:
        "OpenAI is not configured. Add OPENAI_API_KEY to your environment variables to generate AI insights. Store metrics below still come from your live database.",
    };
  }

  return {
    configured: true as const,
    apiKey,
    model,
  };
}
