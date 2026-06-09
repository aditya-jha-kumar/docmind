const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;

export type TextChunk = {
  content: string;
  tokenEstimate: number;
};

export function chunkText(text: string): TextChunk[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [];
  }

  const chunks: TextChunk[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + CHUNK_SIZE, normalized.length);
    const content = normalized.slice(start, end);

    chunks.push({
      content,
      tokenEstimate: Math.ceil(content.length / 4),
    });

    if (end >= normalized.length) {
      break;
    }

    start = end - CHUNK_OVERLAP;
  }

  return chunks;
}
