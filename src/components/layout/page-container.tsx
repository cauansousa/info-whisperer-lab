import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl px-[var(--page-pad)] py-8 md:py-10 space-y-6",
        className
      )}
    >
      {children}
    </div>
  );
}

