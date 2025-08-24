import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Needed for Docker multi-stage build that runs `server.js` from `.next/standalone`
  output: 'standalone',
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
