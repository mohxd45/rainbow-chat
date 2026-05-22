"use client";

import { Lock, Unlock } from "lucide-react";
import { motion } from "framer-motion";
import type { Room } from "@/types";
import { GlassCard } from "./GlassCard";
import { RainbowButton } from "./RainbowButton";
import { ActiveUsersBadge } from "./ActiveUsersBadge";

export function RoomCard({ room, onJoin }: { room: Room; onJoin: (room: Room) => void }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="neon-border flex h-full flex-col p-5 transition hover:-translate-y-1 hover:bg-white/[.08]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">{room.name}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/60">{room.description || "A mysterious rainbow room."}</p>
          </div>
          <span className="rounded-2xl border border-white/10 bg-white/10 p-2">{room.type === "private" ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}</span>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <ActiveUsersBadge count={room.activeUsers} />
          <RainbowButton onClick={() => onJoin(room)} className="px-4 py-2 text-sm">Join</RainbowButton>
        </div>
      </GlassCard>
    </motion.div>
  );
}
