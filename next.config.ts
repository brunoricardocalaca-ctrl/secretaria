import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["xlsx", "unpdf"]
};

export default nextConfig;
