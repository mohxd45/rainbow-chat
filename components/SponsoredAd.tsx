"use client";

import { useEffect, useState } from "react";
import { Shield, Server, ArrowUpRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

type AdType = {
  id: string;
  title: string;
  description: string;
  cta: string;
  link: string;
  badge: string;
  icon: any;
  gradientClass: string;
  borderClass: string;
  glowClass: string;
};

const ADS_DATA: AdType[] = [
  {
    id: "vpn",
    title: "Go Ghost with Rainbow VPN",
    description: "Double your anonymity. Strict zero-logs policy, military-grade encryption, and lightning-fast global servers.",
    cta: "Get 80% Off",
    link: "https://example.com/vpn",
    badge: "Recommended VPN",
    icon: Shield,
    gradientClass: "from-purple-500/20 via-pink-500/5 to-cyan-500/5",
    borderClass: "border-pink-500/20 hover:border-pink-500/40",
    glowClass: "shadow-[0_0_20px_rgba(236,72,153,0.1)]",
  },
  {
    id: "hosting",
    title: "Deploy on Neon Cloud Servers",
    description: "Ultra-low latency VPS starting at $3.50/mo. Perfect for running chats, game servers, or web applications.",
    cta: "Deploy Instantly",
    link: "https://example.com/hosting",
    badge: "Cloud Partner",
    icon: Server,
    gradientClass: "from-cyan-500/20 via-blue-500/5 to-purple-500/5",
    borderClass: "border-cyan-500/20 hover:border-cyan-500/40",
    glowClass: "shadow-[0_0_20px_rgba(6,182,212,0.1)]",
  },
];

interface SponsoredAdProps {
  variant?: "horizontal-banner" | "sidebar-banner";
}

/*
========================================================================
GOOGLE ADSENSE INTEGRATION INSTRUCTIONS:
========================================================================
To replace these mock ads with Google AdSense, please follow these steps:

1. Add the Google AdSense script inside the <head> of your app/layout.tsx file:
   <script 
     async 
     src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_PUBLISHER_ID" 
     crossorigin="anonymous">
   </script>

2. Replace the implementation of the SponsoredAd component with the following JSX:

export function SponsoredAd({ variant = "horizontal-banner" }: SponsoredAdProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense load error:", err);
    }
  }, []);

  return (
    <div className={`w-full overflow-hidden rounded-2xl bg-black/10 border border-white/5 p-2 ${
      variant === "horizontal-banner" ? "min-h-[90px]" : "min-h-[250px]"
    }`}>
      <div className="mb-1 text-[10px] uppercase tracking-wider text-white/30 font-semibold pl-1 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        Sponsored
      </div>
      <ins className="adsbygoogle"
           style={{ display: "block" }}
           data-ad-client="ca-pub-YOUR_PUBLISHER_ID"
           data-ad-slot={variant === "horizontal-banner" ? "YOUR_BANNER_SLOT_ID" : "YOUR_SIDEBAR_SLOT_ID"}
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
}
========================================================================
*/

export function SponsoredAd({ variant = "horizontal-banner" }: SponsoredAdProps) {
  return null;
}
