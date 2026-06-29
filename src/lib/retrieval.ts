import { MIN_RELEVANCE_SCORE, RETRIEVAL_TOP_K } from "./config";
import { generateEmbedding } from "./embeddings";
import { prisma } from "./prisma";
import { getPineconeIndex } from "./pinecone";

export interface RetrievedChunk {
  content: string;
  chunkIndex: number;
  score: number;
}

export async function retrieveRelevantChunks(
  query: string,
  documentId: string,
  userId: string,
  topK = RETRIEVAL_TOP_K
): Promise<RetrievedChunk[]> {
  const [queryEmbedding, pineconeIndex] = await Promise.all([
    generateEmbedding(query, "query"),
    getPineconeIndex(),
  ]);

  const results = await pineconeIndex.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
    filter: {
      documentId: { $eq: documentId },
      userId: { $eq: userId },
    },
  });

  const matches = (results.matches ?? []).filter(
    (match) => (match.score ?? 0) >= MIN_RELEVANCE_SCORE
  );

  if (matches.length === 0) return [];

  const needsDbLookup = matches.some((m) => !m.metadata?.content);
  const contentByPineconeId = new Map<string, string>();

  if (needsDbLookup) {
    const ids = matches.map((m) => m.id).filter(Boolean) as string[];
    const dbChunks = await prisma.documentChunk.findMany({
      where: { documentId, pineconeId: { in: ids } },
      select: { pineconeId: true, content: true, chunkIndex: true },
    });
    for (const chunk of dbChunks) {
      contentByPineconeId.set(chunk.pineconeId, chunk.content);
    }
  }

  return matches
    .map((match) => {
      const fromMeta = match.metadata?.content
        ? String(match.metadata.content)
        : null;
      const content =
        fromMeta ?? contentByPineconeId.get(match.id ?? "") ?? "";

      return {
        content,
        chunkIndex: Number(match.metadata?.chunkIndex ?? 0),
        score: match.score ?? 0,
      };
    })
    .filter((chunk) => chunk.content.length > 0)
    .sort((a, b) => a.chunkIndex - b.chunkIndex);
}
