import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Jangan bundel ssh2 (biar dipanggil langsung oleh Node saat runtime)
      config.externals.push("ssh2");
    }

    // Kalau tetap mau bisa import .node file
    config.module.rules.push({
      test: /\.node$/,
      use: "node-loader",
    });

    return config;
  },
};

export default nextConfig;
