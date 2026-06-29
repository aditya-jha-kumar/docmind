import Link from "next/link";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string;
};

const sizes = {
  sm: { icon: "h-7 w-7", text: "text-base" },
  md: { icon: "h-8 w-8", text: "text-lg" },
  lg: { icon: "h-10 w-10", text: "text-xl" },
};

export default function Logo({
  size = "md",
  showText = true,
  href = "/dashboard",
}: LogoProps) {
  const s = sizes[size];

  return (
    <Link href={href} className="flex items-center gap-2.5 group" prefetch>
      <div
        className={`${s.icon} rounded-xl bg-gradient-to-br from-accent to-[#a855f7] flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-[55%] w-[55%] text-white"
          aria-hidden
        >
          <path
            d="M7 4.5h10a2 2 0 012 2v11a2 2 0 01-2 2H7a2 2 0 01-2-2v-11a2 2 0 012-2z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M9 8.5h6M9 12h4M9 15.5h5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="16.5" cy="16.5" r="3" fill="currentColor" opacity="0.9" />
        </svg>
      </div>
      {showText && (
        <span className={`${s.text} font-semibold tracking-tight`}>
          Doc<span className="text-accent">Mind</span>
        </span>
      )}
    </Link>
  );
}
