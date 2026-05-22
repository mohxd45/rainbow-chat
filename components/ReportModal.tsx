"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { RainbowButton } from "./RainbowButton";
import type { Message } from "@/types";

export function ReportModal({ message, open, onClose, onSubmit }: {
  message: Message | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("Unsafe or abusive message");
  const [loading, setLoading] = useState(false);
  if (!open || !message) return null;

  async function submit() {
    setLoading(true);
    await onSubmit(reason);
    setLoading(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-5 backdrop-blur-sm">
      <GlassCard className="neon-border w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black">Report Message</h2>
          <button onClick={onClose} className="rounded-xl bg-white/10 p-2 hover:bg-white/15"><X className="h-5 w-5" /></button>
        </div>
        <p className="mb-4 rounded-2xl bg-white/5 p-3 text-sm text-white/60 line-clamp-3">{message.text}</p>
        <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-3 outline-none">
          <option>Unsafe or abusive message</option>
          <option>Spam or repeated message</option>
          <option>Harassment</option>
          <option>Hate or offensive content</option>
          <option>Other</option>
        </select>
        <RainbowButton onClick={submit} disabled={loading} className="mt-5 w-full">{loading ? "Reporting..." : "Submit report"}</RainbowButton>
      </GlassCard>
    </div>
  );
}
