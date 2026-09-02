/** @type {import('next').NextConfig} */
process.env.TZ = "Asia/Manila";

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // Domains we serve user-facing images from — all must be whitelisted
    // for next/image to optimize them through the Vercel image pipeline.
    remotePatterns: [
      { protocol: "https", hostname: "media.coletfs.com" },   // Cloudflare R2 custom domain (banners, avatars, media library)
      { protocol: "https", hostname: "**.r2.dev" },            // R2 public bucket fallback
      { protocol: "https", hostname: "**.supabase.co" },       // Supabase storage
      { protocol: "https", hostname: "img.clerk.com" },        // Clerk avatars
      { protocol: "https", hostname: "images.clerk.dev" },     // Clerk avatars (older domain)
      { protocol: "https", hostname: "api.qrserver.com" },     // QR codes in emails / verify page
    ],
  },
};

module.exports = nextConfig;
