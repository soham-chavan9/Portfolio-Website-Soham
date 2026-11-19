import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return [
      // The field-report pages were removed in the redesign; their content
      // now lives in the Experience tab of the lobby.
      { source: "/work/:slug*", destination: "/#experience", permanent: true },
    ];
  },
};

export default nextConfig;
