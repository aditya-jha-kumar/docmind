import { inngest } from "./inngest";

export async function triggerDocumentProcessing(data: {
  documentId: string;
  fileUrl: string;
  userId: string;
}) {
  try {
    await inngest.send({
      name: "document/process",
      data,
    });
  } catch (error) {
    console.error("Failed to trigger document processing:", error);
  }
}
