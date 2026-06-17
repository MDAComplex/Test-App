import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle the pre-seeded SQLite DB with every serverless function so the app
  // works on Vercel without an external database. On cold start, lib/prisma.ts
  // copies it from /var/task (read-only) to /tmp (writable).
  outputFileTracingIncludes: {
    "/**": ["./dev.db"],
  },
};

export default nextConfig;
