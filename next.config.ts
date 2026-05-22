import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/uploads/:path*.webm",
        headers: [
          {
            key: "Content-Type",
            value: "audio/webm",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

