import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <main className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
          DocMind
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Upload PDFs, index them with AI, and chat with your documents using
          retrieval-augmented generation.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/sign-in"
            className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium dark:border-zinc-700"
          >
            Create account
          </Link>
        </div>
      </main>
    </div>
  );
}
