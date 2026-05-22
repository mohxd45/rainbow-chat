import { cn } from "@/lib/utils";

export function GlassCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("glass rounded-3xl", className)}>{children}</div>;
}
