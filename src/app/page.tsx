import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/app/components/logo";

const features = [
  {
    title: "Upload PDFs",
    description: "Drop any PDF and we extract, chunk, and index it automatically.",
    icon: (
      <path
        d="M7 4.5h10a2 2 0 012 2v11a2 2 0 01-2 2H7a2 2 0 01-2-2v-11a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    ),
  },
  {
    title: "Semantic search",
    description: "Find relevant passages using vector embeddings, not just keywords.",
    icon: (
      <path
        d="M10.5 10.5a4.5 4.5 0 107.07 0M21 21l-4.35-4.35"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    ),
  },
  {
    title: "Chat with context",
    description: "Ask questions and get answers grounded in your document content.",
    icon: (
      <path
        d="M8 10h8M8 14h5M6 5.5h12a2 2 0 012 2v8a2 2 0 01-2 2H9l-3 3v-3H6a2 2 0 01-2-2v-8a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    ),
  },
];

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen mesh-gradient">
      <header className="border-b border-border glass">
        <div className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo href="/" size="sm" />
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/sign-in"
              className="rounded-lg px-3 sm:px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-accent px-3 sm:px-5 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover shadow-sm"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20 sm:pb-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs sm:text-sm text-muted-foreground shadow-sm mb-6 animate-fade-in">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            AI-powered document intelligence
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl mx-auto animate-fade-in [animation-delay:50ms]">
            Chat with your{" "}
            <span className="bg-gradient-to-r from-accent to-[#a855f7] bg-clip-text text-transparent">
              PDFs
            </span>
          </h1>

          <p className="mt-5 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in [animation-delay:100ms]">
            Upload documents, get instant semantic search, and ask questions with
            answers grounded in your files — not hallucinations.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-fade-in [animation-delay:150ms]">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto rounded-xl bg-accent px-8 py-3.5 text-sm font-medium text-accent-foreground shadow-md transition-all hover:bg-accent-hover hover:shadow-lg active:scale-[0.98]"
            >
              Start for free
            </Link>
            <Link
              href="/sign-in"
              className="w-full sm:w-auto rounded-xl border border-border bg-card px-8 py-3.5 text-sm font-medium shadow-sm transition-all hover:border-accent/40 hover:shadow-md active:scale-[0.98]"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28">
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-accent/30 hover:shadow-md animate-fade-in"
                style={{ animationDelay: `${200 + i * 75}ms` }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-muted text-accent mb-4">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>DocMind — built for document Q&amp;A</p>
      </footer>
    </div>
  );
}
