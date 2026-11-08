import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components off: every page reads fresh data from the database.
  cacheComponents: false,
  // Self-contained server in .next/standalone, used by the Docker image.
  output: "standalone",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
