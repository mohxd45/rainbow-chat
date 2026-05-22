import { Radio } from "lucide-react";

export function ActiveUsersBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-100">
      <Radio className="h-3.5 w-3.5" /> {Math.max(0, count || 0)} active
    </span>
  );
}
