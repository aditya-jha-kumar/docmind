export const GEMINI_CHAT_MODEL =
  process.env.GEMINI_CHAT_MODEL ?? "gemini-2.5-flash";

export const GEMINI_EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001";

export const GEMINI_EMBEDDING_DIMENSIONS = Number(
  process.env.GEMINI_EMBEDDING_DIMENSIONS ?? 768
);

/** Higher = more creative answers; lower = more literal. 0.4–0.6 works well for RAG. */
export const CHAT_TEMPERATURE = Number(process.env.CHAT_TEMPERATURE ?? 0.5);
