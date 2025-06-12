import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Vercel 배포 시 ESLint 에러를 무시
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScript 에러도 무시 (개발용)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
