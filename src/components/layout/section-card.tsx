import { cn } from "@/lib/utils";

type SectionCardProps = React.HTMLAttributes<HTMLDivElement>;

export function SectionCard({ className, ...props }: SectionCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card/70 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.4)] backdrop-blur-sm",
        "transition-shadow duration-200 hover:shadow-[0_25px_60px_-32px_rgba(0,0,0,0.45)]",
        className
      )}
      {...props}
    />
  );
}

