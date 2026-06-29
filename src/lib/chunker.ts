export interface TextChunk {
  content: string;
  index: number;
  tokenEstimate: number;
}

export function chunkText(
  text: string,
  chunkSize: number,
  overlap: number
): TextChunk[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    const content = normalized.slice(start, end);

    chunks.push({
      content,
      index,
      tokenEstimate: Math.ceil(content.length / 4),
    });

    if (end === normalized.length) break;

    start = Math.max(0, end - overlap);
    index++;
  }

  return chunks;
}
