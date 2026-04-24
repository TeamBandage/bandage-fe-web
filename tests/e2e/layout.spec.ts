import { expect, test } from '@playwright/test';

/**
 * (main) 레이아웃 반응형 렌더 테스트.
 * 인증 가드가 동작하므로 /login 페이지를 통해 토큰/브레이크포인트 CSS 만 검증한다.
 * 실제 인증 후 Sidebar/BottomNav 동시 가시성 검증은 백엔드 기동 후 별도 시나리오에서 다룬다.
 */

test.describe('(main) 레이아웃 반응형 구조', () => {
  test('데스크톱 뷰포트(1440x900): /playground/layout 의 Sidebar 와 Topbar 가 렌더된다', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/playground/layout');
    await expect(page.locator('[data-slot="sidebar"]')).toBeVisible();
    await expect(page.locator('[data-slot="topbar"]')).toBeVisible();
    // /playground/layout 는 두 개의 데모 섹션을 렌더하므로 pane-* 슬롯은 2개씩 존재한다.
    await expect(page.locator('[data-slot="pane-split"]').first()).toBeVisible();
    await expect(page.locator('[data-slot="pane-list"]').first()).toBeVisible();
    await expect(page.locator('[data-slot="pane-detail"]').first()).toBeVisible();
  });

  test('모바일 뷰포트(375x812): /playground/layout 의 Sidebar 는 숨김 상태', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/playground/layout');
    // Sidebar 는 DOM 에는 있지만 hidden class 로 display:none 이어야 함
    await expect(page.locator('[data-slot="sidebar"]')).toBeHidden();
  });

  test('브레이크포인트 경계(961px): Sidebar 가 보이기 시작한다', async ({ page }) => {
    await page.setViewportSize({ width: 961, height: 800 });
    await page.goto('/playground/layout');
    await expect(page.locator('[data-slot="sidebar"]')).toBeVisible();
  });

  test('브레이크포인트 직전(959px): Sidebar 는 숨김 상태', async ({ page }) => {
    await page.setViewportSize({ width: 959, height: 800 });
    await page.goto('/playground/layout');
    await expect(page.locator('[data-slot="sidebar"]')).toBeHidden();
  });
});
