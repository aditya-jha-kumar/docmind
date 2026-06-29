"use client";

import { UploadDropzone } from "@/lib/uploadthing";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-6 sm:p-8 shadow-sm">
      <div className="mb-6 text-center sm:text-left">
        <h2 className="text-lg font-semibold">Upload a document</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Drop a PDF here or click to browse. Max 16 MB.
        </p>
      </div>

      <div className={uploading ? "pointer-events-none opacity-60" : ""}>
        <UploadDropzone
          endpoint="pdfUploader"
          appearance={{
            container:
              "flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 px-6 py-12 transition-colors ut-uploading:border-accent ut-uploading:bg-accent-muted/30",
            label: "text-sm font-medium text-foreground",
            allowedContent: "text-xs text-muted-foreground mt-2",
            button:
              "mt-4 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover ut-uploading:bg-accent/70",
          }}
          onUploadBegin={() => {
            setUploading(true);
            setError(null);
          }}
          onClientUploadComplete={async (res) => {
            setUploading(false);
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
            } catch (err) {
              console.error("Upload completion error:", err);
              setError("File uploaded but failed to save. Please try again.");
            }
          }}
          onUploadError={(err) => {
            setUploading(false);
            console.error("Upload error:", err);
            setError(err.message || "Upload failed. Please try again.");
          }}
        />
      </div>

      {uploading && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          Uploading your document…
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-danger-muted px-4 py-3 text-sm text-danger text-center">
          {error}
        </p>
      )}
    </div>
  );
}
