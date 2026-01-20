import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["pdf-parse", "@thednp/dommatrix", "path2d-polyfill"]
};

export default nextConfig;
