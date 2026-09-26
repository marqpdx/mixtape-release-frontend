import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@mixtape/api",
    "@mixtape/auth",
    "@mixtape/content",
    "@mixtape/core",
  ],
  allowedDevOrigins: [
    "http://127.0.0.1:3012",
    "http://localhost:3012",
  ],
};

export default nextConfig;
