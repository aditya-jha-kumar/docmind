"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProcessingStatus({
  status,
}: {
  status: "PROCESSING" | "READY" | "FAILED";
}) {
  const router = useRouter();

  useEffect(() => {
    if (status !== "PROCESSING") return;

    const interval = setInterval(() => {
      router.refresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [status, router]);

  if (status !== "PROCESSING") return null;

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div className="relative h-14 w-14 shrink-0">
          <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
          <div className="absolute inset-0 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-accent" aria-hidden>
              <path
                d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
        <div>
          <h3 className="font-medium">Processing your document</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Extracting text, generating embeddings, and indexing for search.
            This usually takes under a minute.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            This page refreshes automatically.
          </p>
        </div>
      </div>

      <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full w-1/3 rounded-full bg-gradient-to-r from-accent to-[#a855f7] animate-[shimmer_2s_ease-in-out_infinite]"
          style={{ backgroundSize: "200% 100%" }}
        />
      </div>
    </div>
  );
}
