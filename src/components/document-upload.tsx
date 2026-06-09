"use client";

import { UploadButton } from "@/lib/uploadthing";
import { useRouter } from "next/navigation";

export default function DocumentUpload() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed rounded-xl">
      <p className="text-sm text-gray-500">
        Upload a PDF to get started
      </p>

      <UploadButton
        endpoint="pdfUploader"
        onClientUploadComplete={(res) => {
          const documentId = res?.[0]?.serverData?.documentId;

          if (documentId) {
            router.push(`/documents/${documentId}`);
          }
        }}
        onUploadError={(error: Error) => {
          console.error("Upload error:", error);
          alert(`Upload failed: ${error.message}`);
        }}
      />
    </div>
  );
}