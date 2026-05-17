import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        // Twitch user profile pictures CDN
        protocol: 'https',
        hostname: 'static-cdn.jtvnw.net',
      },
      {
        // Twitch profile images (hosted externally)
        protocol: 'https',
        hostname: '*.jtvnw.net',
      },
    ],
  },
};

export default nextConfig;
