import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const names = [
  "RainbowFox", "NeonTiger", "CosmicWave", "PixelDragon", "GalaxyPanda",
  "ElectricWolf", "MysticLion", "CrystalFalcon", "AuroraOtter", "PlasmaKoala",
  "NovaRabbit", "CyberPhoenix", "LunarDolphin", "SolarPenguin",
];

const avatars = ["🦊", "🐯", "🌊", "🐉", "🐼", "🐺", "🦁", "🦅", "🦦", "🐨", "🐰", "🔥", "🐬", "🐧", "🌈", "⚡"];

export function generateAnonymousProfile() {
  const name = names[Math.floor(Math.random() * names.length)] + Math.floor(100 + Math.random() * 900);
  const avatar = avatars[Math.floor(Math.random() * avatars.length)];
  return { anonymousName: name, avatar };
}

export function generateRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function formatTime(value: any) {
  if (!value) return "now";
  const date = value?.toDate ? value.toDate() : new Date(value);
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date);
}

const badWords = ["fuck", "shit", "bitch", "asshole", "bastard", "slut", "whore"];

export function filterBadWords(text: string) {
  let clean = text;
  badWords.forEach((word) => {
    clean = clean.replace(new RegExp(`\\b${word}\\b`, "gi"), "***");
  });
  return clean.trim();
}

export function parseUserAgent(ua: string): string {
  if (!ua) return "Unknown Device";

  // Check iOS devices
  if (/iPhone/i.test(ua)) {
    return "Apple iPhone";
  }
  if (/iPad/i.test(ua)) {
    return "Apple iPad";
  }

  // Check Android devices
  if (/Android/i.test(ua)) {
    // Extract model name from the parentheses block
    const match = ua.match(/\(([^)]+)\)/);
    if (match && match[1]) {
      const parts = match[1].split(";");
      for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i].trim();
        if (part.includes("Build/")) {
          return "Android (" + part.split("Build/")[0].trim() + ")";
        }
        if (part.startsWith("Android")) {
          continue;
        }
        if (/Linux|wv|U|en-us|en-gb|mobile/i.test(part)) {
          continue;
        }
        if (part.length > 2) {
          return `Android (${part})`;
        }
      }
    }
    return "Android Device";
  }

  // Check Desktop systems
  if (/Windows NT/i.test(ua)) {
    return "Windows PC";
  }
  if (/Macintosh/i.test(ua)) {
    return "Mac PC";
  }
  if (/Linux/i.test(ua)) {
    return "Linux PC";
  }

  return "Web Browser";
}

export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") return "server";
  const parts = [
    window.navigator.userAgent,
    window.screen.width + "x" + window.screen.height,
    window.screen.colorDepth,
    new Date().getTimezoneOffset(),
    window.navigator.language,
    window.navigator.platform,
    (window.navigator as any).hardwareConcurrency || "",
    (window.navigator as any).deviceMemory || "",
  ];
  const str = parts.join("||");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return "fp_" + Math.abs(hash).toString(36);
}


