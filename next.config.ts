import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        // Rewrites are disabled in favor of Middleware handling for better control over 'www' and 'opbase.in' cases.
        // Middleware at src/middleware.ts now handles subdomain redirects.
      ],
    }
  }
};

export default nextConfig;
