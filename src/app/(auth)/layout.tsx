import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-auth-surface">
      <div className="absolute right-[var(--page-pad)] top-6 z-10">
        <ThemeToggle />
      </div>
      <div className="flex min-h-screen items-center justify-center px-[var(--page-pad)] py-10">
        <div className="w-full max-w-5xl">
          {children}
        </div>
      </div>
    </div>
  );
}
