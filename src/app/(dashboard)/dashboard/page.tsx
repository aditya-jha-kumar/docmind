import DocumentUpload from "@/app/components/document-upload";
import { getOrCreateUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getOrCreateUser();

  const documents = await prisma.document.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Your Documents</h1>

      <DocumentUpload />

      <div className="mt-8 space-y-3">
        {documents.map((doc) => (
          <Link
            key={doc.id}
            href={`/documents/${doc.id}/chat`}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <span className="font-medium">{doc.filename}</span>
            <span className={`text-sm px-2 py-1 rounded-full ${
              doc.status === "READY"
                ? "bg-green-100 text-green-700"
                : doc.status === "FAILED"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
            }`}>
              {doc.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}