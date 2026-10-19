import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "api.casasysoluciones.co", pathname: "/**" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
