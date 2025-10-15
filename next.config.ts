import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      resolveAlias: {
        pdfkit: false,
        fontkit: false,
      },
    },
  },
};

export default nextConfig;
