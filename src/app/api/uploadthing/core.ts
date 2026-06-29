// src/app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { prisma } from "@/lib/prisma";
import { triggerDocumentProcessing } from "@/lib/document-processing";
import { getOrCreateUser } from "@/lib/user";

const f = createUploadthing();

export const ourFileRouter = {
  pdfUploader: f(
    { pdf: { maxFileSize: "16MB", maxFileCount: 1 } },
    { awaitServerData: false }
  )

    // Runs before upload — authenticate user
    .middleware(async () => {
      const user = await getOrCreateUser();
      return { userId: user.id };
    })

    // Runs after upload — create DB record + trigger pipeline
    .onUploadComplete(async ({ metadata, file }) => {
      const { userId } = metadata;

      const existing = await prisma.document.findFirst({
        where: { userId, fileUrl: file.url },
      });
      if (existing) {
        return { documentId: existing.id };
      }

      // Create document record in Postgres
      const document = await prisma.document.create({
        data: {
          userId,
          filename: file.name,
          fileUrl: file.url,
          fileSize: file.size,
          status: "PROCESSING",
        },
      });

      // Trigger pipeline in the background — don't block the upload callback
      void triggerDocumentProcessing({
        documentId: document.id,
        fileUrl: file.url,
        userId,
      });

      return { documentId: document.id };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;