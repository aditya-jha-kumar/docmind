import Logo from "@/app/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen mesh-gradient flex flex-col">
      <header className="p-4 sm:p-6">
        <Logo href="/" size="sm" />
      </header>
      <div className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md animate-fade-in">{children}</div>
      </div>
    </div>
  );
}
