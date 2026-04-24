import { defineConfig, devices } from '@playwright/test';

// 로컬에서 port 3000 은 외부 서비스(예: grafana)가 점유하는 경우가 있어 기본값을 3100 으로 지정.
// CI 에서는 3000 이 비어 있으므로 기존처럼 3000 을 사용한다.
const PORT = process.env.PORT ?? (process.env.CI ? '3000' : '3100');
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `pnpm next dev --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
