import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["openai", "resend", "bcryptjs"],
};

export default nextConfig;
