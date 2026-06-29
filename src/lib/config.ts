/** PDF chunking — larger chunks = fewer embedding API calls */
export const CHUNK_SIZE = Number(process.env.CHUNK_SIZE ?? 1000);
export const CHUNK_OVERLAP = Number(process.env.CHUNK_OVERLAP ?? 100);

/** Ingestion embedding batches */
export const EMBEDDING_BATCH_SIZE = Number(process.env.EMBEDDING_BATCH_SIZE ?? 20);
export const EMBEDDING_PARALLEL_WAVES = Number(
  process.env.EMBEDDING_PARALLEL_WAVES ?? 3
);

/** Retrieval */
export const RETRIEVAL_TOP_K = Number(process.env.RETRIEVAL_TOP_K ?? 6);
export const MIN_RELEVANCE_SCORE = Number(process.env.MIN_RELEVANCE_SCORE ?? 0.35);

/** Chat — limit history sent to the model */
export const CHAT_HISTORY_LIMIT = Number(process.env.CHAT_HISTORY_LIMIT ?? 12);
