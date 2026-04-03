import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  typedRoutes: true,
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ["longport"]
};

export default nextConfig;
