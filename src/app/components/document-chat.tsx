"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";

const SUGGESTIONS = [
  "What is this document about?",
  "Summarize the key points",
  "What are the main conclusions?",
];

type DocumentChatProps = {
  documentId: string;
  chatId?: string;
  initialMessages: UIMessage[];
  filename: string;
};

function MessageAvatar({ role }: { role: "user" | "assistant" | "system" }) {
  const isUser = role === "user";
  const isAssistant = role === "assistant";

  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
        isUser
          ? "bg-accent text-accent-foreground"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {isUser ? (
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
          <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M5 19c0-3.3 3.1-6 7-6s7 2.7 7 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ) : isAssistant ? (
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
          <path
            d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <span>S</span>
      )}
    </div>
  );
}

export default function DocumentChat({
  documentId,
  chatId,
  initialMessages,
  filename,
}: DocumentChatProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    id: chatId ?? `doc-${documentId}`,
    messages: initialMessages,
    transport: new TextStreamChatTransport({
      api: "/api/chat",
      body: { documentId, chatId },
    }),
  });

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isBusy]);

  function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    sendMessage({ text: trimmed });
    setInput("");
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-10rem)] sm:h-[calc(100dvh-11rem)] min-h-[420px] mt-4 sm:mt-6">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin space-y-5 pr-1 sm:pr-2 pb-4"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center animate-fade-in">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-muted text-accent mb-4">
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden>
                <path
                  d="M8 10h8M8 14h5M7 4.5h10a2 2 0 012 2v11a2 2 0 01-2 2H7a2 2 0 01-2-2v-11a2 2 0 012-2z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <h3 className="font-medium text-lg">Ask anything about this document</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Answers are grounded in <span className="font-medium text-foreground">{filename}</span> using semantic search.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSend(suggestion)}
                  disabled={isBusy}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground hover:bg-accent-muted/50 disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 animate-fade-in ${
              message.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <MessageAvatar role={message.role} />
            <div
              className={`max-w-[min(85%,32rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                message.role === "user"
                  ? "bg-accent text-accent-foreground rounded-tr-md"
                  : "bg-card border border-border text-card-foreground rounded-tl-md"
              }`}
            >
              {message.parts.map((part, index) =>
                part.type === "text" ? (
                  <p key={index} className="whitespace-pre-wrap">
                    {part.text}
                  </p>
                ) : null
              )}
            </div>
          </div>
        ))}

        {isBusy && (
          <div className="flex gap-3 animate-fade-in">
            <MessageAvatar role="assistant" />
            <div className="rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-pulse-soft" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-pulse-soft [animation-delay:0.2s]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-pulse-soft [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 pt-3 sm:pt-4 border-t border-border bg-background/80 backdrop-blur-sm">
        <form
          className="flex gap-2 sm:gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
        >
          <input
            className="flex-1 min-w-0 rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this document…"
            disabled={isBusy}
          />
          <button
            type="submit"
            disabled={isBusy || !input.trim()}
            className="shrink-0 rounded-xl bg-accent px-4 sm:px-5 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span className="hidden sm:inline">Send</span>
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden>
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-muted-foreground hidden sm:block">
          AI responses are based on retrieved document excerpts.
        </p>
      </div>
    </div>
  );
}
