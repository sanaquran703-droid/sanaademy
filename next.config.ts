import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Docker/Render deployment
  output: "standalone",
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
