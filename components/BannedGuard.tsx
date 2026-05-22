"use client";

import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert } from "lucide-react";
import { GlassCard } from "./GlassCard";

export function BannedGuard({ children }: { children: React.ReactNode }) {
  const { appUser } = useAuth();

  if (appUser?.banned) {
    return (
      <main className="fixed inset-0 z-50 grid place-items-center bg-black/80 px-5 backdrop-blur-md">
        <GlassCard className="neon-border max-w-md p-8 text-center shadow-2xl border-red-500/30">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Access Denied</h1>
          <p className="mt-4 text-white/70 leading-relaxed">
            Your account has been suspended by the administrator for violating chat safety guidelines.
          </p>
          <p className="mt-6 text-xs text-white/40">
            ID: {appUser.uid}
          </p>
        </GlassCard>
      </main>
    );
  }

  return <>{children}</>;
}
