import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.dev",         // Cloudflare R2 public bucket
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",    // Supabase storage (fallback)
      },
    ],
  },
};

export default nextConfig;
