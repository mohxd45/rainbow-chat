"use client";

import Link from "next/link";
import { Sparkles, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStealth } from "@/components/StealthProvider";

export function Navbar() {
  const { appUser } = useAuth();
  const { toggleDisguise } = useStealth();
  
  return (
    <nav className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5">
      <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 shadow-neon">
          <Sparkles className="h-5 w-5 text-cyan-200" />
        </span>
        <span>Rainbow Chat</span>
      </Link>
      <div className="flex items-center gap-3">
        <Link href="/admin" className="rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-semibold text-white/60 hover:text-white flex items-center gap-1.5 transition">
          <Shield className="h-3.5 w-3.5 text-cyan-300" /> Admin
        </Link>
        {appUser && <div className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/80">{appUser.avatar} {appUser.anonymousName}</div>}
        <button
          onClick={toggleDisguise}
          title="Network status: Secure"
          className="flex items-center justify-center p-1.5 hover:bg-white/5 rounded-full transition"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </button>
      </div>
    </nav>
  );
}
