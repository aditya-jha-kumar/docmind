type DocumentStatus = "PROCESSING" | "READY" | "FAILED";

const config: Record<
  DocumentStatus,
  { label: string; className: string; dot?: boolean }
> = {
  READY: {
    label: "Ready",
    className: "bg-success-muted text-success",
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-warning-muted text-warning",
    dot: true,
  },
  FAILED: {
    label: "Failed",
    className: "bg-danger-muted text-danger",
  },
};

export default function StatusBadge({ status }: { status: DocumentStatus }) {
  const { label, className, dot } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse-soft" />
      )}
      {label}
    </span>
  );
}
