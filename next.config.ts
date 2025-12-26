import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        // Rewrite root (/) on any subdomain to /storefront
        // Exclude 'www' to allow main site if needed.
        // For localhost, we check if subdomain exists (wildcard).
        // For production, similarly.

        // This regex matches: (something).localhost OR (something).domain.com
        // But Next.js 'host' matching is specific.

        {
          source: '/',
          has: [
            {
              type: 'host',
              value: '(?<subdomain>.+)\\.localhost:3000',
            },
          ],
          destination: '/storefront',
        },
        {
          // Production/Generic support (domain.com with subdomain)
          // Adjust domain as per actual production domain
          source: '/',
          has: [
            {
              type: 'host',
              value: '(?<subdomain>.+)\\.(?!localhost).+\\..+', // primitive check for sub.domain.com
            }
          ],
          destination: '/storefront',
        }
      ],
    }
  }
};

export default nextConfig;
