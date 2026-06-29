"use client";

import { useLinkStatus } from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function TopBar({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 overflow-hidden bg-accent/20" aria-hidden>
      <div className="h-full w-1/3 animate-[shimmer_0.8s_ease-in-out_infinite] bg-accent" />
    </div>
  );
}

/** Top progress bar — starts on internal link click, ends when route settles */
export function NavigationProgress() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || anchor.target === "_blank") return;
      if (href.startsWith("http") && !href.startsWith(window.location.origin)) return;

      setPending(true);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    setPending(false);
  }, [pathname]);

  return <TopBar active={pending} />;
}

/** Wrap inside <Link> to dim label while that link is navigating */
export function LinkPendingIndicator({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useLinkStatus();

  return (
    <span
      className={`${className} ${pending ? "opacity-60" : ""} transition-opacity`}
    >
      {children}
    </span>
  );
}
