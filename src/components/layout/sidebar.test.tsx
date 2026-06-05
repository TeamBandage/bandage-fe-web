import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Sidebar } from './sidebar';

vi.mock('next/navigation', () => ({
  usePathname: () => '/bands',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/domain/member/hooks/useMe', () => ({
  useMe: () => ({ data: { name: '수연', email: 'sooyeon@example.com' } }),
}));

function withQueryClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

describe('Sidebar', () => {
  it('활성 경로(/bands) 및 로그인 사용자 정보 렌더 스냅샷', () => {
    const { asFragment } = render(withQueryClient(<Sidebar />));
    expect(asFragment()).toMatchSnapshot();
  });

  it('active 상태의 Link 는 bg-nav-active/30 / text-white / font-bold 를 가진다', () => {
    const { getByRole } = render(withQueryClient(<Sidebar />));
    const bandsLink = getByRole('link', { name: /밴드/ });
    expect(bandsLink.className).toContain('bg-nav-active/30');
    expect(bandsLink.className).toContain('text-white');
    expect(bandsLink.className).toContain('font-bold');
    expect(bandsLink.getAttribute('aria-current')).toBe('page');
  });

  it('합주 항목은 expandable 버튼으로 노출되며 비활성 시 hover 컬러를 사용', () => {
    const { getByRole } = render(withQueryClient(<Sidebar />));
    // 합주는 서브 메뉴 펼침 토글 버튼.
    const practicesToggle = getByRole('button', { name: /합주/ });
    expect(practicesToggle.tagName).toBe('BUTTON');
    expect(practicesToggle.className).toContain('text-foreground-sub');
  });
});
