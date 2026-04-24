import { expect, test } from '@playwright/test';

test.describe('온보딩(랜딩) 페이지', () => {
  test('비인증 / 접근 시 /onboarding 으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/onboarding$/);
  });

  test('/onboarding 에 Hero 와 Features 가 렌더된다', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.locator('[data-slot="onboarding-hero"]')).toBeVisible();
    await expect(page.locator('[data-slot="onboarding-features"]')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Bandage' })).toBeVisible();
  });

  test('[시작하기] CTA 는 /join 으로 연결된다', async ({ page }) => {
    await page.goto('/onboarding');
    const cta = page.getByRole('link', { name: '시작하기' });
    await expect(cta).toHaveAttribute('href', '/join');
  });

  test('[이미 계정이 있어요] CTA 는 /login 으로 연결된다', async ({ page }) => {
    await page.goto('/onboarding');
    const cta = page.getByRole('link', { name: '이미 계정이 있어요' });
    await expect(cta).toHaveAttribute('href', '/login');
  });

  test('데스크톱(1440): Features 가 3열 grid 로 렌더된다', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/onboarding');
    const features = page.locator('[data-slot="onboarding-features"] [data-feature]');
    await expect(features).toHaveCount(3);
  });

  test('모바일(375): Features 도 3개, grid 세로 스택 (Hero CTA 는 column)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/onboarding');
    const features = page.locator('[data-slot="onboarding-features"] [data-feature]');
    await expect(features).toHaveCount(3);
    await expect(page.locator('[data-slot="onboarding-cta"]')).toBeVisible();
  });
});
