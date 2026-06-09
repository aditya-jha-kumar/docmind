"use client";

import { FormEvent, useState } from "react";

type DocumentChatProps = {
  documentId: string;
};

export default function DocumentChat({ documentId }: DocumentChatProps) {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [chatId, setChatId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const trimmed = message.trim();
    if (!trimmed || loading) {
      return;
    }

    setLoading(true);
    setError(null);
    setResponse("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          chatId,
          message: trimmed,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const nextChatId = res.headers.get("X-Chat-Id");
      if (nextChatId) {
        setChatId(nextChatId);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("No response stream");
      }

      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        text += decoder.decode(value, { stream: true });
        setResponse(text);
      }

      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-lg font-semibold">Chat with this document</h2>

      {response && (
        <div className="rounded-lg border bg-zinc-50 p-4 text-sm whitespace-pre-wrap dark:bg-zinc-900">
          {response}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Ask a question about this document..."
          className="flex-1 rounded-lg border px-4 py-2 text-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
