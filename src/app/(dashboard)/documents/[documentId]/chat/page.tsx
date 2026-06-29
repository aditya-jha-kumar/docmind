import { notFound } from "next/navigation";
import { getOrCreateUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DocumentChatPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const user = await getOrCreateUser();

  const document = await prisma.document.findFirst({
    where: { id: documentId, userId: user.id },
  });

  if (!document) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">
        ← Back to documents
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-2">{document.filename}</h1>

      <span
        className={`inline-block text-sm px-2 py-1 rounded-full ${
          document.status === "READY"
            ? "bg-green-100 text-green-700"
            : document.status === "FAILED"
            ? "bg-red-100 text-red-700"
            : "bg-yellow-100 text-yellow-700"
        }`}
      >
        {document.status}
      </span>

      {document.status === "PROCESSING" && (
        <p className="mt-6 text-zinc-600">
          Your document is being processed. This page will update when it is ready for chat.
        </p>
      )}

      {document.status === "READY" && (
        <p className="mt-6 text-zinc-600">
          Document is ready. Chat UI coming soon.
        </p>
      )}

      {document.status === "FAILED" && (
        <p className="mt-6 text-red-600">
          Processing failed. Please try uploading again.
        </p>
      )}
    </div>
  );
}
