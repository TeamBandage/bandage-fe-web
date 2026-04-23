import { expect, test } from '@playwright/test';

test.describe('Auth guard middleware', () => {
  test('비인증 사용자가 /home 접근 시 /login 으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/\/login/);
  });

  test('로그인 페이지는 정상 접근되며 회원가입 링크가 노출된다', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
    await expect(page.getByRole('link', { name: '회원가입' })).toBeVisible();
  });

  test('회원가입 페이지는 정상 접근되며 로그인 링크가 노출된다', async ({ page }) => {
    await page.goto('/join');
    await expect(page.getByRole('heading', { name: '회원가입' })).toBeVisible();
    await expect(page.getByRole('link', { name: '로그인' })).toBeVisible();
  });

  // TODO(backend): 아래 시나리오는 Bandage 백엔드가 로컬에서 기동된 이후 활성화
  // - 회원가입 → 자동 로그인 → /home 접근
  // - 로그인 → /me 접근 → 회원 정보 표시
  // - 로그아웃 → /home 접근 시 /login 리다이렉트
  // - 잘못된 로그인 정보 입력 시 에러 메시지 표시
});
