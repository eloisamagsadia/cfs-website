/** @type {import('next').NextConfig} */
process.env.TZ = "Asia/Manila";

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
