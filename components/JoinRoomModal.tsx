"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { X } from "lucide-react";
import { db, collection, getDocs, query, where } from "@/lib/firebase";
import { GlassCard } from "./GlassCard";
import { RainbowButton } from "./RainbowButton";

export function JoinRoomModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const q = query(collection(db, "rooms"), where("roomCode", "==", code.trim().toUpperCase()), where("isActive", "==", true));
      const snap = await getDocs(q);
      if (snap.empty) {
        setError("Invalid room code. Please check and try again.");
        return;
      }
      router.push(`/rooms/${snap.docs[0].id}`);
    } catch {
      setError("Could not join this room right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-5 backdrop-blur-sm">
      <GlassCard className="neon-border w-full max-w-md p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-black">Join with Code</h2>
          <button onClick={onClose} className="rounded-xl bg-white/10 p-2 hover:bg-white/15"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={join} className="space-y-4">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ROOM CODE" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 uppercase tracking-[.25em] outline-none ring-cyan-300/40 focus:ring-2" />
          {error && <p className="rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
          <RainbowButton disabled={loading} type="submit" className="w-full">{loading ? "Joining..." : "Join room"}</RainbowButton>
        </form>
      </GlassCard>
    </div>
  );
}
