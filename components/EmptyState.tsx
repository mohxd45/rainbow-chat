import { MessageCircle } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[.04] p-8 text-center">
      <MessageCircle className="mb-4 h-10 w-10 text-cyan-200" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-white/60">{description}</p>
    </div>
  );
}
