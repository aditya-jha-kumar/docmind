import { PDFParse } from "pdf-parse";
import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { chunkText, type TextChunk } from "@/lib/chunking";
import { embedTexts } from "@/lib/embeddings";
import { getPineconeIndex } from "@/lib/pinecone";

const BATCH_SIZE = 10;

type ProcessDocumentEvent = {
  documentId: string;
  fileUrl: string;
  userId: string;
};

export const processDocument = inngest.createFunction(
  {
    id: "process-document",
    retries: 2,
    triggers: [{ event: "document/process" }],
  },
  async ({ event, step }) => {
    const { documentId, fileUrl, userId } = event.data as ProcessDocumentEvent;

    try {
      const parsed = await step.run("parse-pdf", async () => {
        const parser = new PDFParse({ url: fileUrl });

        try {
          const result = await parser.getText();
          return {
            text: result.text,
            pageCount: result.pages.length,
          };
        } finally {
          await parser.destroy();
        }
      });

      const chunks = await step.run("chunk-text", async () =>
        chunkText(parsed.text),
      );

      if (chunks.length === 0) {
        throw new Error("No text could be extracted from the PDF");
      }

      await step.run("embed-and-store", async () => {
        const index = getPineconeIndex();

        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
          const batch = chunks.slice(i, i + BATCH_SIZE) as TextChunk[];
          const embeddings = await embedTexts(
            batch.map((chunk: TextChunk) => chunk.content),
          );

          const records = batch.map((chunk: TextChunk, batchIndex: number) => {
            const chunkIndex = i + batchIndex;
            const pineconeId = `${documentId}-${chunkIndex}`;

            return {
              id: pineconeId,
              values: embeddings[batchIndex]!,
              metadata: {
                documentId,
                userId,
                chunkIndex,
              },
            };
          });

          await index.upsert({ records });

          await prisma.$transaction(
            records.map((record, batchIndex: number) => {
              const chunk = batch[batchIndex]!;

              return prisma.documentChunk.create({
                data: {
                  documentId,
                  content: chunk.content,
                  chunkIndex: i + batchIndex,
                  tokenEstimate: chunk.tokenEstimate,
                  pineconeId: record.id,
                },
              });
            }),
          );
        }
      });

      await step.run("mark-ready", async () => {
        await prisma.document.update({
          where: { id: documentId },
          data: {
            status: "READY",
            pageCount: parsed.pageCount,
          },
        });
      });

      return { documentId, chunkCount: chunks.length };
    } catch (error) {
      await step.run("mark-failed", async () => {
        await prisma.document.update({
          where: { id: documentId },
          data: { status: "FAILED" },
        });
      });

      throw error;
    }
  },
);
