import { prisma } from "@/lib/prisma";
import { embedText } from "@/lib/embeddings";
import { getPineconeIndex } from "@/lib/pinecone";

export async function retrieveRelevantChunks(
  query: string,
  documentId: string,
  userId: string,
  topK = 5,
) {
  const queryEmbedding = await embedText(query);
  const index = getPineconeIndex();

  const results = await index.query({
    vector: queryEmbedding,
    topK,
    filter: {
      documentId: { $eq: documentId },
      userId: { $eq: userId },
    },
  });

  const pineconeIds =
    results.matches?.map((match) => match.id).filter(Boolean) ?? [];

  if (pineconeIds.length === 0) {
    return [];
  }

  return prisma.documentChunk.findMany({
    where: {
      documentId,
      pineconeId: { in: pineconeIds as string[] },
    },
    orderBy: { chunkIndex: "asc" },
  });
}
