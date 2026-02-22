import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["openai", "resend", "bcryptjs", "@react-pdf/renderer"],
  experimental: {
    optimizePackageImports: ["recharts"],
  },
};

export default nextConfig;
