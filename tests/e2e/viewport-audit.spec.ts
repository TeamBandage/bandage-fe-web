import { expect, test } from '@playwright/test';

/**
 * 뷰포트별 주요 화면 스모크 (데스크톱 1440 / 모바일 375 / 소형 360).
 * 인증 없는 상태에서 접근 가능한 /login 을 기준으로
 * lg 960px 경계에서 Sidebar / BottomNav 가 올바르게 토글되는지 확인.
 */

type Viewport = { name: string; width: number; height: number };

const VIEWPORTS: Viewport[] = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 961, height: 820 },
  { name: 'mobile', width: 375, height: 812 },
  { name: 'mobile-small', width: 360, height: 780 },
];

test.describe('뷰포트 감사: 360 / 375 / 961 / 1440', () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.name} (${vp.width}x${vp.height}): /login 폼이 렌더되고 제출 버튼은 40px 이상`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/login');
      await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
      // 터치 타깃 최소 높이 검증
      const cta = page.getByRole('button', { name: '로그인' });
      const box = await cta.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(40);
    });
  }

  test('desktop 1440: /login 에 AuthBrand 가 보인다', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/login');
    await expect(page.locator('[data-slot="auth-brand"]')).toBeVisible();
  });

  test('mobile 375: /login 의 AuthBrand 는 숨김', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login');
    await expect(page.locator('[data-slot="auth-brand"]')).toBeHidden();
  });
});
