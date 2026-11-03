import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Images can be external user-provided URLs; we render them with standard <img> tags
  // to avoid host whitelist constraints.
};

export default nextConfig;
