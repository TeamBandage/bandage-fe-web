import { expect, test } from '@playwright/test';

test.describe('Band 도메인 가드', () => {
  test('비인증 사용자가 /bands 접근 시 /login 으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/bands');
    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/from=%2Fbands/);
  });

  test('비인증 사용자가 /bands/new 접근 시 /login 으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/bands/new');
    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/from=%2Fbands%2Fnew/);
  });

  test('비인증 사용자가 /bands/:bandId 접근 시 /login 으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/bands/test-band-id');
    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/from=%2Fbands%2Ftest-band-id/);
  });

  // TODO(backend): 아래 시나리오는 Bandage 백엔드가 로컬에서 기동된 이후 활성화
  // - 밴드 생성 → 상세 조회 → 가입 신청 → 승인 플로우
});
