import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" is only used by the sandbox packaging flow.
  // On Vercel, the default output is used (Vercel sets VERCEL=1 during builds).
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  poweredByHeader: false,
  /**
   * Preview panel / gateway origins allowed to fetch /_next/* dev assets
   * and HMR websockets. The preview panel serves the app through a
   * *.space-z.ai host, which Next 16 treats as cross-origin.
   */
  allowedDevOrigins: ["*.space-z.ai"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
