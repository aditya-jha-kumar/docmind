"use client";

import { UploadButton } from "@/lib/uploadthing";
import { useRouter } from "next/navigation";

type UploadedFile = {
  name: string;
  size: number;
  url: string;
  serverData?: { documentId?: string };
};

async function createDocumentFromUpload(file: UploadedFile) {
  const response = await fetch("/api/documents/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      fileUrl: file.url,
      fileSize: file.size,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to save document");
  }

  const data = (await response.json()) as { documentId: string };
  return data.documentId;
}

export default function DocumentUpload() {
  const router = useRouter();

  return (
    <div>
      <p>Upload a PDF to get started</p>
      <UploadButton
        endpoint="pdfUploader"
        onClientUploadComplete={async (res) => {
          const file = res?.[0];
          if (!file) return;

          try {
            const documentId =
              (file.serverData as { documentId?: string } | null)?.documentId ??
              (await createDocumentFromUpload({
                name: file.name,
                size: file.size,
                url: file.url,
              }));

            router.push(`/documents/${documentId}/chat`);
            router.refresh();
          } catch (error) {
            console.error("Upload completion error:", error);
            alert("File uploaded but failed to save. Please refresh and try again.");
          }
        }}
        onUploadError={(error) => {
          console.error("Upload error:", error);
          alert("Error uploading file. Please try again.");
        }}
      />
    </div>
  );
}
