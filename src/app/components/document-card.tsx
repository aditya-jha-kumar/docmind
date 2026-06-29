import Link from "next/link";
import StatusBadge from "./status-badge";
import { LinkPendingIndicator } from "./navigation-progress";
import { formatFileSize, formatRelativeDate } from "@/lib/format";

type DocumentCardProps = {
  id: string;
  filename: string;
  status: "PROCESSING" | "READY" | "FAILED";
  fileSize: number;
  pageCount: number | null;
  createdAt: Date;
};

export default function DocumentCard({
  id,
  filename,
  status,
  fileSize,
  pageCount,
  createdAt,
}: DocumentCardProps) {
  return (
    <Link
      href={`/documents/${id}/chat`}
      prefetch
      className="group flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-accent/40 hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5"
          aria-hidden
        >
          <path
            d="M7 4.5h10a2 2 0 012 2v11a2 2 0 01-2 2H7a2 2 0 01-2-2v-11a2 2 0 012-2z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M9 8.5h6M9 12h4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="truncate font-medium text-card-foreground group-hover:text-accent transition-colors pr-2">
            <LinkPendingIndicator>{filename}</LinkPendingIndicator>
          </h3>
          <StatusBadge status={status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatFileSize(fileSize)}
          {pageCount != null && ` · ${pageCount} page${pageCount !== 1 ? "s" : ""}`}
          {" · "}
          {formatRelativeDate(createdAt)}
        </p>
      </div>

      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 mt-1"
        aria-hidden
      >
        <path
          d="M9 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
