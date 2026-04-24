import { expect, test } from '@playwright/test';

test.describe('홈 대시보드 가드', () => {
  test('비인증 사용자가 /home 접근 시 /login 으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/from=%2Fhome/);
  });

  test('비인증 사용자가 / 접근 시 /home 을 거쳐 /login 으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  // TODO(backend): 아래 시나리오는 Bandage 백엔드가 로컬에서 기동된 이후 활성화
  // - 홈 대시보드 3개 섹션(가까운 합주, 내 밴드, 예정 공연) 렌더링 확인
  // - 각 섹션의 Skeleton/EmptyState/ErrorState 확인
});
