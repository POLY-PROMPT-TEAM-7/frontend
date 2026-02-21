import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    proxyClientMaxBodySize: 10 * 1024 * 1024,
  },
};

export default nextConfig;
