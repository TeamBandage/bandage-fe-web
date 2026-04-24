import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from './button';

describe('Button', () => {
  it('기본 렌더는 primary/md 변형을 반영한다', () => {
    const { asFragment } = render(<Button>저장</Button>);
    expect(asFragment()).toMatchSnapshot();
  });

  it('variant 와 size props에 따라 클래스가 바뀐다', () => {
    const { asFragment } = render(
      <Button variant="danger" size="lg">
        삭제
      </Button>,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('loading 상태에서 Spinner 가 표시되고 aria-busy 가 설정된다', () => {
    render(<Button loading>저장 중</Button>);
    const btn = screen.getByRole('button', { name: /저장 중/ });
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toBeDisabled();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('asChild 로 렌더되면 전달된 요소가 사용된다', () => {
    // href 는 Next.js 내부 페이지 라우트를 피하도록 외부 URL 로 지정
    // (no-html-link-for-pages 룰은 실제 app 라우트 경로에만 반응하므로 외부 URL 은 무해)
    render(
      <Button asChild>
        <a href="https://example.com/bands">밴드로 이동</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: '밴드로 이동' });
    expect(link).toHaveAttribute('href', 'https://example.com/bands');
  });
});
