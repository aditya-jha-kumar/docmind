import { DocumentsListSkeleton } from "@/app/components/skeletons";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 sm:space-y-10 animate-pulse">
      <div className="space-y-3">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-72 max-w-full rounded bg-muted" />
      </div>
      <div className="h-40 rounded-2xl border border-border bg-card" />
      <DocumentsListSkeleton />
    </div>
  );
}
