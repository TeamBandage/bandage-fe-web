import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
    css: true,
    passWithNoTests: true,
    env: {
      NEXT_PUBLIC_API_BASE_URL: 'http://localhost:8080',
      NEXT_PUBLIC_APP_ENV: 'local',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      // 아직 커버리지 베이스라인을 측정하지 않아 0으로 시작한다. Phase D1 게이트가
      // 이 값을 실제로 강제하므로, 베이스라인 확인 후 점진적으로 올릴 것.
      thresholds: {
        lines: Number(process.env.COVERAGE_THRESHOLD ?? 0),
      },
    },
  },
});
