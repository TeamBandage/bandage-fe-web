import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Docker runtime 이미지를 ~150MB 로 줄이기 위한 standalone 산출물.
   * `.next/standalone/` + `.next/static/` + `public/` 만 복사하면 동작.
   */
  output: 'standalone',
};

export default nextConfig;
