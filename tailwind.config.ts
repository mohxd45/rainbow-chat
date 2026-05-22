import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 24px rgba(34,211,238,.35), 0 0 54px rgba(217,70,239,.18)",
      },
      animation: {
        aurora: "aurora 14s ease-in-out infinite alternate",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        aurora: {
          "0%": { transform: "translate3d(-8%, -8%, 0) scale(1)" },
          "50%": { transform: "translate3d(8%, 4%, 0) scale(1.08)" },
          "100%": { transform: "translate3d(-2%, 8%, 0) scale(1.02)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
