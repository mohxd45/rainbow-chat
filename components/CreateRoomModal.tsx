"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { X } from "lucide-react";
import { db, addDoc, collection, serverTimestamp } from "@/lib/firebase";
import { generateRoomCode } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { GlassCard } from "./GlassCard";
import { RainbowButton } from "./RainbowButton";

export function CreateRoomModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { appUser } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"public" | "private">("public");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function createRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!appUser) return;
    if (name.trim().length < 3) return setError("Room name must be at least 3 characters.");
    setLoading(true);
    setError("");
    try {
      const roomCode = generateRoomCode();
      const ref = await addDoc(collection(db, "rooms"), {
        name: name.trim(),
        description: description.trim(),
        type,
        roomCode,
        createdBy: appUser.uid,
        createdAt: serverTimestamp(),
        activeUsers: 0,
        isActive: true,
      });
      router.push(`/rooms/${ref.id}`);
    } catch {
      setError("Could not create room. Check Firebase setup and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-5 backdrop-blur-sm">
      <GlassCard className="neon-border w-full max-w-lg p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-black">Create Room</h2>
          <button onClick={onClose} className="rounded-xl bg-white/10 p-2 hover:bg-white/15"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={createRoom} className="space-y-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Room name" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none ring-cyan-300/40 focus:ring-2" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Room description" className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none ring-cyan-300/40 focus:ring-2" />
          <div className="grid grid-cols-2 gap-3">
            {(["public", "private"] as const).map((item) => (
              <button type="button" key={item} onClick={() => setType(item)} className={`rounded-2xl border px-4 py-3 capitalize transition ${type === item ? "border-cyan-300/60 bg-cyan-300/15" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>{item}</button>
            ))}
          </div>
          <p className="text-xs text-white/50">A unique room code is generated automatically. Private rooms can be joined only with this code.</p>
          {error && <p className="rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
          <RainbowButton type="submit" disabled={loading} className="w-full">{loading ? "Creating..." : "Create room"}</RainbowButton>
        </form>
      </GlassCard>
    </div>
  );
}
