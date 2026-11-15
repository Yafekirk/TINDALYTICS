type OpenAiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OpenAiChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

export async function createOpenAiJsonCompletion(params: {
  apiKey: string;
  model: string;
  messages: OpenAiChatMessage[];
  temperature?: number;
}): Promise<{ content: string } | { error: string }> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      temperature: params.temperature ?? 0.3,
      response_format: { type: "json_object" },
      messages: params.messages,
    }),
  });

  const payload = (await response.json()) as OpenAiChatResponse;

  if (!response.ok) {
    return {
      error:
        payload.error?.message ??
        `OpenAI request failed with status ${response.status}`,
    };
  }

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    return { error: "OpenAI returned an empty response." };
  }

  return { content };
}
