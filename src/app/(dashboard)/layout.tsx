import { UserButton } from "@clerk/nextjs";
import Logo from "@/app/components/logo";
import { NavigationProgress } from "@/app/components/navigation-progress";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen mesh-gradient">
      <NavigationProgress />
      <header className="sticky top-0 z-50 border-b border-border glass">
        <div className="mx-auto flex h-14 sm:h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo size="sm" />
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-9 w-9 ring-2 ring-border",
              },
            }}
          />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
