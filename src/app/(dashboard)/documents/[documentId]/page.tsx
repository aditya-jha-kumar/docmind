import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import DocumentChat from "@/components/document-chat";
import { prisma } from "@/lib/prisma";

type DocumentPageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { userId } = await auth();
  if (!userId) {
    notFound();
  }

  const { documentId } = await params;

  const document = await prisma.document.findFirst({
    where: { id: documentId, userId },
  });

  if (!document) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-block text-sm text-zinc-500 hover:text-zinc-800"
      >
        ← Back to dashboard
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{document.filename}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Uploaded {document.createdAt.toLocaleDateString()}
            {document.pageCount != null ? ` · ${document.pageCount} pages` : ""}
          </p>
        </div>

        <span
          className={`rounded-full px-2 py-1 text-sm ${
            document.status === "READY"
              ? "bg-green-100 text-green-700"
              : document.status === "FAILED"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {document.status}
        </span>
      </div>

      {document.status === "READY" ? (
        <DocumentChat documentId={document.id} />
      ) : document.status === "PROCESSING" ? (
        <p className="mt-8 text-sm text-zinc-500">
          This document is still being processed. Refresh the page in a moment.
        </p>
      ) : (
        <p className="mt-8 text-sm text-red-600">
          Processing failed for this document. Try uploading it again.
        </p>
      )}
    </div>
  );
}
