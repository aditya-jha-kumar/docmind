import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/lib/inngest";

const f = createUploadthing();

export const ourFileRouter = {
  pdfUploader: f({ pdf: { maxFileSize: "16MB", maxFileCount: 1 } })

    .middleware(async () => {
      const { userId } = await auth();

      if (!userId) throw new Error("Unauthorized");

      console.log("✅ Middleware passed for user:", userId);

      return { userId };
    })

    .onUploadComplete(async ({ metadata, file }) => {
      const { userId } = metadata;

      try {
        console.log("✅ onUploadComplete triggered for user:", userId);

        const document = await prisma.document.create({
          data: {
            userId,
            filename: file.name,
            fileUrl: file.url,
            fileSize: file.size,
            status: "PROCESSING",
          },
        });

        console.log("✅ Document created in Postgres:", document.id);

        await inngest.send({
          name: "document/process",
          data: {
            documentId: document.id,
            fileUrl: file.url,
            userId,
          },
        });

        console.log("✅ Inngest event sent for document:", document.id);

        return { documentId: document.id };

      } catch (error) {
        console.error("❌ onUploadComplete failed:", error);
        throw error;
      }
    }),

} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;