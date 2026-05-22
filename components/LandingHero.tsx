"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, MessageSquareText, ShieldCheck, UsersRound } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { RainbowButton } from "./RainbowButton";

const features = [
  { icon: UsersRound, title: "Anonymous usernames", text: "Chat with colorful identities, never real names or emails." },
  { icon: MessageSquareText, title: "Real-time rooms", text: "Messages appear instantly with smooth live updates." },
  { icon: Lock, title: "Private room codes", text: "Create private spaces and share invite codes." },
  { icon: ShieldCheck, title: "Safety tools", text: "Filtering, cooldowns, reports, and admin deletion." },
];

export function LandingHero() {
  return (
    <main className="relative z-10 mx-auto flex min-h-[calc(100vh-90px)] max-w-7xl flex-col px-5 pb-12">
      <div className="grid flex-1 items-center gap-8 lg:grid-cols-[1.1fr_.9fr]">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
          <GlassCard className="neon-border p-7 sm:p-10 lg:p-12">
            <div className="mb-6 inline-flex rounded-full border border-cyan-200/20 bg-cyan-200/10 px-4 py-2 text-sm text-cyan-100">Next-gen anonymous social chats</div>
            <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-7xl">
              Rainbow <span className="bg-gradient-to-r from-pink-300 via-cyan-200 to-emerald-200 bg-clip-text text-transparent">Chat</span>
            </h1>
            <p className="mt-5 text-xl font-semibold text-white/90">Anonymous group chats for everyone</p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
              Join public or private rooms and chat without revealing your real identity. Every user gets a random anonymous username and playful avatar.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/enter"><RainbowButton className="w-full sm:w-auto">Join Chat</RainbowButton></Link>
              <Link href="/dashboard"><button className="w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15 sm:w-auto">Create Room</button></Link>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .7, delay: .15 }} className="grid gap-4 sm:grid-cols-2">
          {features.map((feature, i) => (
            <GlassCard key={feature.title} className="neon-border p-5 transition hover:-translate-y-1 hover:bg-white/[.08]">
              <feature.icon className="mb-5 h-8 w-8 text-cyan-200" />
              <h3 className="font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/60">{feature.text}</p>
            </GlassCard>
          ))}
        </motion.div>
      </div>
    </main>
  );
}
