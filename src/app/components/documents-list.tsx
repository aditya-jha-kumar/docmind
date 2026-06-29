import DocumentCard from "@/app/components/document-card";
import { getOrCreateUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export async function DocumentStats() {
  const user = await getOrCreateUser();
  const counts = await prisma.document.groupBy({
    by: ["status"],
    where: { userId: user.id },
    _count: true,
  });

  const total = counts.reduce((sum, c) => sum + c._count, 0);
  if (total === 0) return null;

  const ready = counts.find((c) => c.status === "READY")?._count ?? 0;
  const processing =
    counts.find((c) => c.status === "PROCESSING")?._count ?? 0;

  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <div className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm shadow-sm">
        <span className="text-muted-foreground">Total </span>
        <span className="font-semibold">{total}</span>
      </div>
      <div className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm shadow-sm">
        <span className="text-muted-foreground">Ready </span>
        <span className="font-semibold text-success">{ready}</span>
      </div>
      {processing > 0 && (
        <div className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm shadow-sm">
          <span className="text-muted-foreground">Processing </span>
          <span className="font-semibold text-warning">{processing}</span>
        </div>
      )}
    </div>
  );
}

export async function DocumentsGrid() {
  const user = await getOrCreateUser();

  const documents = await prisma.document.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      filename: true,
      status: true,
      fileSize: true,
      pageCount: true,
      createdAt: true,
    },
  });

  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          No documents yet. Upload your first PDF above to get started.
        </p>
      </div>
    );
  }

  return (
    <section>
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
        Recent documents
      </h2>
      <div className="grid gap-3 sm:gap-4">
        {documents.map((doc) => (
          <DocumentCard key={doc.id} {...doc} />
        ))}
      </div>
    </section>
  );
}
