import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only bundle the icons actually used
  experimental: { optimizePackageImports: ["lucide-react"] },
};

export default nextConfig;
