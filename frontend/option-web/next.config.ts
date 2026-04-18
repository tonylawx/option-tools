import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  typedRoutes: true,
  transpilePackages: ["@tonylaw/auth", "@tonylaw/contracts", "@tonylaw/shared", "@tonylaw/ui"],
  outputFileTracingRoot: path.join(process.cwd(), "../..")
};

export default nextConfig;
