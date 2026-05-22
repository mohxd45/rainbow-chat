"use client";

import Link from "next/link";
import { Copy, Home, Lock } from "lucide-react";
import type { Room } from "@/types";
import { ActiveUsersBadge } from "./ActiveUsersBadge";
import { useStealth } from "@/components/StealthProvider";

export function ChatHeader({ room }: { room: Room }) {
  const { toggleDisguise } = useStealth();
  async function copyCode() {
    if (room.roomCode) await navigator.clipboard.writeText(room.roomCode);
  }

  return (
    <header className="glass sticky top-0 sm:top-3 z-20 mx-auto mb-0 sm:mb-4 flex max-w-5xl items-center justify-between gap-4 rounded-none sm:rounded-3xl px-4 py-3 border-x-0 border-t-0 sm:border-x sm:border-t sm:neon-border bg-black/60 sm:bg-transparent border-b border-white/10 sm:border-b-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="rounded-xl bg-white/10 p-2 hover:bg-white/15"><Home className="h-4 w-4" /></Link>
          <h1 className="truncate text-lg font-black sm:text-2xl">{room.name}</h1>
        </div>
        <p className="mt-1 line-clamp-1 text-xs text-white/50">{room.description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {room.type === "private" && (
          <button 
            onClick={copyCode} 
            title="Copy room code"
            className="inline-flex items-center gap-1.5 rounded-full border border-pink-300/20 bg-pink-300/10 px-2.5 py-1 text-xs font-medium text-pink-100 transition hover:bg-pink-300/20 active:scale-95"
          >
            <Lock className="h-3 w-3" /> 
            <span className="font-mono font-bold tracking-wider">{room.roomCode}</span> 
            <Copy className="h-3 w-3 opacity-60 hover:opacity-100" />
          </button>
        )}
        <ActiveUsersBadge count={room.activeUsers} />
        <button
          onClick={toggleDisguise}
          title="Security status: Encrypted"
          className="flex items-center justify-center p-1.5 hover:bg-white/5 rounded-full transition ml-1"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </button>
      </div>
    </header>
  );
}
