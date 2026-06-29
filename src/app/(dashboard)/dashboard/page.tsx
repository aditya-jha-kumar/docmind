import DocumentUpload from "@/app/components/document-upload";
import {
  DocumentStats,
  DocumentsGrid,
} from "@/app/components/documents-list";
import { DocumentsListSkeleton, StatsSkeleton } from "@/app/components/skeletons";
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Your documents
        </h1>
        <p className="mt-2 text-muted-foreground text-sm sm:text-base max-w-xl">
          Upload PDFs and chat with them using AI-powered semantic search.
        </p>
        <Suspense fallback={<StatsSkeleton />}>
          <DocumentStats />
        </Suspense>
      </div>

      <DocumentUpload />

      <Suspense fallback={<DocumentsListSkeleton />}>
        <DocumentsGrid />
      </Suspense>
    </div>
  );
}
