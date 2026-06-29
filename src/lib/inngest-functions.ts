import { inngest } from "./inngest";
import { prisma } from "./prisma";
import { extractTextFromPDF } from "./pdf";
import { chunkText } from "./chunker";
import { generateEmbeddings } from "./embeddings";
import { getPineconeIndex } from "./pinecone";
import {
  CHUNK_OVERLAP,
  CHUNK_SIZE,
  EMBEDDING_BATCH_SIZE,
  EMBEDDING_PARALLEL_WAVES,
} from "./config";
import type { TextChunk } from "./chunker";

async function markDocumentFailed(documentId: string) {
  await prisma.document.update({
    where: { id: documentId },
    data: { status: "FAILED" },
  });
}

async function processEmbeddingBatch(
  documentId: string,
  userId: string,
  batch: TextChunk[]
) {
  const embeddings = await generateEmbeddings(batch.map((c) => c.content));

  const pineconeRecords = batch.map((chunk, j) => ({
    id: `${documentId}_chunk_${chunk.index}`,
    values: embeddings[j],
    metadata: {
      documentId,
      userId,
      chunkIndex: chunk.index,
    },
  }));

  const dbRecords = batch.map((chunk, j) => ({
    documentId,
    content: chunk.content,
    chunkIndex: chunk.index,
    tokenEstimate: chunk.tokenEstimate,
    pineconeId: pineconeRecords[j].id,
  }));

  const pineconeIndex = await getPineconeIndex();
  await Promise.all([
    pineconeIndex.upsert({ records: pineconeRecords }),
    prisma.documentChunk.createMany({ data: dbRecords }),
  ]);
}

export const processDocument = inngest.createFunction(
  {
    id: "process-document",
    retries: 3,
    triggers: [{ event: "document/process" }],
    onFailure: async ({ event }) => {
      const documentId = event.data.event.data.documentId as string;
      await markDocumentFailed(documentId);
    },
  },
  async ({ event, step }) => {
    const { documentId, fileUrl, userId } = event.data;

    try {
      const { text, pageCount } = await step.run("extract-text", () =>
        extractTextFromPDF(fileUrl)
      );

      const chunks = await step.run("chunk-text", () =>
        chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP)
      );

      if (chunks.length === 0) {
        throw new Error("No text could be extracted from the PDF");
      }

      const batches: TextChunk[][] = [];
      for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
        batches.push(chunks.slice(i, i + EMBEDDING_BATCH_SIZE));
      }

      for (let w = 0; w < batches.length; w += EMBEDDING_PARALLEL_WAVES) {
        const wave = batches.slice(w, w + EMBEDDING_PARALLEL_WAVES);
        await step.run(`embed-store-${w}`, () =>
          Promise.all(
            wave.map((batch) => processEmbeddingBatch(documentId, userId, batch))
          )
        );
      }

      await step.run("mark-ready", () =>
        prisma.document.update({
          where: { id: documentId },
          data: { status: "READY", pageCount },
        })
      );

      return { documentId, chunksProcessed: chunks.length };
    } catch (error) {
      await markDocumentFailed(documentId);
      throw error;
    }
  }
);
