import { inngest } from "./inngest";
import { prisma } from "./prisma";
import { extractTextFromPDF } from "./pdf";
import { chunkText } from "./chunker";
import { generateEmbedding } from "./embeddings";
import { pineconeIndex } from "./pinecone";

export const processDocument = inngest.createFunction(
  {
    id: "process-document",
    retries: 3,
    triggers: [{ event: "document/process" }],
  },
  async ({ event, step }) => {
    const { documentId, fileUrl, userId } = event.data;

    // ── STEP 1: Extract text ──────────────────────────
    const { text, pageCount } = await step.run(
      "extract-text",
      async () => {
        return await extractTextFromPDF(fileUrl);
      }
    );

    // ── STEP 2: Chunk the text ────────────────────────
    const chunks = await step.run(
      "chunk-text",
      async () => {
        return chunkText(text, 500, 50);
      }
    );

    // ── STEP 3: Embed + store each chunk ──────────────
    await step.run("embed-and-store", async () => {
      const BATCH_SIZE = 10;
      const pineconeVectors = [];
      const dbChunks = [];

      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);

        const embedded = await Promise.all(
          batch.map(async (chunk) => {
            const embedding = await generateEmbedding(chunk.content);
            return { chunk, embedding };
          })
        );

        for (const { chunk, embedding } of embedded) {
          const pineconeId = `${documentId}_chunk_${chunk.index}`;

          // Prepare for Pinecone
          pineconeVectors.push({
            id: pineconeId,
            values: embedding,
            metadata: {
              documentId,
              userId,
              content: chunk.content,
              chunkIndex: chunk.index,
            },
          });

          // Prepare for Postgres
          dbChunks.push({
            documentId,
            content: chunk.content,
            chunkIndex: chunk.index,
            tokenEstimate: chunk.tokenEstimate,
            pineconeId,
          });
        }
      }

      // Store vectors in Pinecone
      await pineconeIndex.upsert({ records: pineconeVectors });

      // Store chunk metadata in Postgres
      await prisma.documentChunk.createMany({
        data: dbChunks,
      });
    });

    // ── STEP 4: Mark document as READY ────────────────
    await step.run("mark-ready", async () => {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: "READY",
          pageCount,
        },
      });
    });

    return { documentId, chunksProcessed: chunks.length };
  }
);