"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { RainbowButton } from "@/components/RainbowButton";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";

export default function EnterPage() {
  const router = useRouter();
  const { appUser, loading, enterAnonymously } = useAuth();

  useEffect(() => {
    if (appUser) {
      const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
      const redirectPath = searchParams.get("redirect") || "/dashboard";
      router.replace(redirectPath);
    }
  }, [appUser, router]);

  async function handleEnter() {
    try {
      await enterAnonymously();
      const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
      const redirectPath = searchParams.get("redirect") || "/dashboard";
      router.replace(redirectPath);
    } catch (e: any) {
      console.error("[EnterPage] Error during handleEnter:", e);
      alert("Error joining: " + (e?.message || String(e)));
    }
  }

  return (
    <main className="relative z-10 grid min-h-screen place-items-center px-5 py-12">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl">
        <GlassCard className="neon-border p-8 text-center sm:p-10">
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-3xl bg-white/10 shadow-neon">
            <Shield className="h-8 w-8 text-cyan-200" />
          </div>
          <h1 className="text-3xl font-black sm:text-5xl">Enter anonymously</h1>
          <p className="mx-auto mt-4 max-w-md text-white/65">No real name. No email shown. Firebase creates a private anonymous account, then Rainbow Chat gives you a random username and avatar.</p>
          <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-5 text-left text-sm text-white/70">
            <div className="flex items-center gap-2 font-semibold text-white"><Sparkles className="h-4 w-4 text-yellow-200" /> Example identities</div>
            <p className="mt-3">RainbowFox • NeonTiger • CosmicWave • PixelDragon • GalaxyPanda</p>
          </div>
          <div className="mt-8 flex justify-center">
            {loading ? <LoadingSpinner label="Preparing your anonymous profile" /> : <RainbowButton onClick={handleEnter}>Generate Identity & Join</RainbowButton>}
          </div>
        </GlassCard>
      </motion.div>
    </main>
  );
}
