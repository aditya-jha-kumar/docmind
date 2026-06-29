import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import ProcessingStatus from "@/app/components/processing-status";
import StatusBadge from "@/app/components/status-badge";
import { ChatPageSkeleton } from "@/app/components/skeletons";
import { CHAT_HISTORY_LIMIT } from "@/lib/config";
import { formatFileSize } from "@/lib/format";
import { getOrCreateUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import type { UIMessage } from "ai";

const DocumentChat = dynamic(
  () => import("@/app/components/document-chat"),
  { loading: () => <ChatPageSkeleton /> }
);

function dbMessageToUIMessage(message: {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
}): UIMessage {
  return {
    id: message.id,
    role: message.role === "USER" ? "user" : "assistant",
    parts: [{ type: "text", text: message.content }],
  };
}

export default async function ChatPageContent({
  documentId,
}: {
  documentId: string;
}) {
  const user = await getOrCreateUser();

  const [document, chat] = await Promise.all([
    prisma.document.findFirst({
      where: { id: documentId, userId: user.id },
      select: {
        id: true,
        filename: true,
        status: true,
        fileSize: true,
        pageCount: true,
      },
    }),
    prisma.chat.findFirst({
      where: { userId: user.id, documentId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: CHAT_HISTORY_LIMIT,
          select: { id: true, role: true, content: true },
        },
      },
    }),
  ]);

  if (!document) {
    notFound();
  }

  const initialMessages =
    chat?.messages
      .slice()
      .reverse()
      .map(dbMessageToUIMessage) ?? [];

  return (
    <>
      <div className="mb-4 sm:mb-6">
        <Link
          href="/dashboard"
          prefetch
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
            <path
              d="M15 6l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to documents
        </Link>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
              {document.filename}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatFileSize(document.fileSize)}
              {document.pageCount != null &&
                ` · ${document.pageCount} page${document.pageCount !== 1 ? "s" : ""}`}
            </p>
          </div>
          <StatusBadge status={document.status} />
        </div>
      </div>

      <ProcessingStatus status={document.status} />

      {document.status === "READY" && (
        <DocumentChat
          documentId={document.id}
          chatId={chat?.id}
          initialMessages={initialMessages}
          filename={document.filename}
        />
      )}

      {document.status === "FAILED" && (
        <div className="mt-6 rounded-xl border border-danger/30 bg-danger-muted p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-danger/10 text-danger">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-danger">Processing failed</h3>
              <p className="mt-1 text-sm text-danger/80">
                Re-upload the document from the dashboard after checking your API
                keys.
              </p>
              <Link
                href="/dashboard"
                prefetch
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Go to dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
