import { expect, test } from '@playwright/test';

test.describe('Practice 도메인 가드', () => {
  test('비인증 사용자가 /jams 접근 시 /login 으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/jams');
    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/from=%2Fjams/);
  });

  test('비인증 사용자가 /jams/new 접근 시 /login 으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/jams/new');
    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/from=%2Fjams%2Fnew/);
  });

  test('비인증 사용자가 /jams/:practiceId 접근 시 /login 으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/jams/test-practice-id');
    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/from=%2Fjams%2Ftest-practice-id/);
  });

  // TODO(backend): 아래 시나리오는 Bandage 백엔드가 로컬에서 기동된 이후 활성화
  // - 합주 생성 → 세션 추가 → 배정 → 삭제 플로우
});
