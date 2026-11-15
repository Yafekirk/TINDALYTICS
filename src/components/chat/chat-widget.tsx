"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

const SUGGESTIONS = [
  "How do I record a POS sale?",
  "What products are low on stock?",
  "How much utang is outstanding?",
  "Summarize sales this month",
];

function messageText(parts: { type: string; text?: string }[]) {
  return parts
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text)
    .join("");
}

function hasActiveTools(parts: { type: string; state?: string }[]) {
  return parts.some(
    (part) =>
      part.type.startsWith("tool-") &&
      part.state !== "output-available" &&
      part.state !== "output-error",
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/ai/chat" }),
    [],
  );

  const { messages, sendMessage, status, error, setMessages, clearError } =
    useChat({
      transport,
      onError(err) {
        console.error("Tinda Assistant:", err);
      },
    });

  const busy = status === "submitted" || status === "streaming";
  const errorMessage = formatChatError(error);

  function formatChatError(err: Error | undefined) {
    if (!err) return null;
    const raw = err.message || "";
    const lower = raw.toLowerCase();
    if (
      lower.includes("credit") ||
      lower.includes("quota") ||
      lower.includes("billing") ||
      lower.includes("insufficient")
    ) {
      return "AI provider quota exceeded. Prefer free Gemini: add GOOGLE_GENERATIVE_AI_API_KEY from aistudio.google.com/apikey, restart, then try again.";
    }
    if (lower.includes("incorrect api key") || lower.includes("invalid api key")) {
      return "AI API key looks invalid. Check GOOGLE_GENERATIVE_AI_API_KEY (or OPENAI_API_KEY) in .env.local and restart the server.";
    }
    if (raw === "An error occurred." || raw.trim() === "") {
      return "Chat request failed. Add a free Gemini key (GOOGLE_GENERATIVE_AI_API_KEY), restart the server, then try again.";
    }
    return raw;
  }

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, busy, open]);

  function submitMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    clearError();
    void sendMessage({ text: trimmed });
    setInput("");
  }

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {open ? (
        <section
          className="pointer-events-auto flex h-[min(34rem,calc(100vh-6rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_18px_50px_-24px_rgba(27,54,93,0.55)]"
          aria-label="Tinda Assistant chat"
        >
          <header className="flex items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-navy to-primary px-4 py-3 text-white">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-accent-soft" />
                <h2 className="truncate text-sm font-semibold">
                  Tinda Assistant
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-accent-soft/95">
                Ask about the app or your store data
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {messages.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-white hover:bg-white/15 hover:text-white"
                  onClick={() => {
                    setMessages([]);
                    clearError();
                  }}
                >
                  Clear
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
                aria-label="Close chat"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto bg-page px-3 py-3"
          >
            {messages.length === 0 ? (
              <div className="space-y-3 rounded-2xl border border-border bg-white p-3">
                <p className="text-sm text-secondary">
                  Hi! I can help you use Tindalytics or answer questions about
                  sales, stock, expenses, and utang.
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="rounded-full border border-border bg-accent-soft/40 px-3 py-1.5 text-left text-xs text-navy transition hover:border-accent hover:bg-accent-soft/70"
                      onClick={() => submitMessage(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((message) => {
              const text = messageText(message.parts);
              const lookingUp = hasActiveTools(message.parts);
              if (!text && !lookingUp && message.role === "assistant") {
                return null;
              }

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[90%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                      message.role === "user"
                        ? "bg-primary text-white"
                        : "border border-border bg-white text-navy",
                    )}
                  >
                    {text ||
                      (lookingUp ? (
                        <span className="inline-flex items-center gap-2 text-secondary">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Looking up store data…
                        </span>
                      ) : null)}
                  </div>
                </div>
              );
            })}

            {busy && messages.at(-1)?.role === "user" ? (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-white px-3 py-2 text-sm text-secondary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Thinking…
                </div>
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-2xl border border-danger/30 bg-red-50 px-3 py-2 text-xs text-danger">
                {errorMessage}
              </div>
            ) : null}
          </div>

          <form
            className="border-t border-border bg-white p-3"
            onSubmit={(event) => {
              event.preventDefault();
              submitMessage(input);
            }}
          >
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(event) => setInput(event.currentTarget.value)}
                placeholder="Ask Tinda Assistant…"
                disabled={busy}
                className="h-10"
                aria-label="Chat message"
              />
              <Button
                type="submit"
                size="icon"
                disabled={busy || !input.trim()}
                aria-label="Send message"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      <Button
        type="button"
        size="icon"
        className="pointer-events-auto h-14 w-14 rounded-full shadow-lg shadow-primary/25"
        aria-label={open ? "Close Tinda Assistant" : "Open Tinda Assistant"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
