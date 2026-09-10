import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  /* إخفاء زر أدوات التطوير حتى لا يغطي الزر العائم للمساعد */
  devIndicators: false,
};

export default nextConfig;
