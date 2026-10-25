import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
