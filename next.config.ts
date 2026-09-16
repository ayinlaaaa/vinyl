import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Development only: lets a sandboxed/preview hostname load dev assets (fonts, HMR).
  // Set ALLOWED_DEV_ORIGINS="host1,host2" in the environment; ignored in production.
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean),
};

export default nextConfig;
