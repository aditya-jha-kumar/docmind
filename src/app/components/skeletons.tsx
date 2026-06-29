export function DocumentsListSkeleton() {
  return (
    <section className="animate-pulse">
      <div className="h-4 w-36 rounded bg-muted mb-4" />
      <div className="grid gap-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-4 rounded-xl border border-border bg-card p-4"
          >
            <div className="h-11 w-11 shrink-0 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/5 rounded bg-muted" />
              <div className="h-3 w-2/5 rounded bg-muted" />
            </div>
            <div className="h-6 w-16 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function ChatPageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-7 w-2/3 max-w-md rounded bg-muted" />
        <div className="h-4 w-40 rounded bg-muted" />
      </div>
      <div className="h-24 rounded-xl border border-border bg-card" />
      <div className="space-y-4 pt-4">
        <div className="flex gap-3">
          <div className="h-8 w-8 rounded-lg bg-muted" />
          <div className="h-16 w-2/3 rounded-2xl bg-muted" />
        </div>
        <div className="flex gap-3 flex-row-reverse">
          <div className="h-8 w-8 rounded-lg bg-muted" />
          <div className="h-12 w-1/2 rounded-2xl bg-muted" />
        </div>
      </div>
      <div className="h-12 rounded-xl bg-muted mt-auto" />
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="mt-5 flex flex-wrap gap-3 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-10 w-24 rounded-lg bg-muted" />
      ))}
    </div>
  );
}
