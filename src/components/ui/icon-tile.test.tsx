import { render } from '@testing-library/react';
import { Music } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { IconTile } from './icon-tile';

describe('IconTile', () => {
  it('기본 렌더는 md/accent 변형을 반영한다', () => {
    const { asFragment } = render(<IconTile icon={<Music />} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('size lg + tone amber 조합 클래스를 반영한다', () => {
    const { asFragment } = render(<IconTile icon={<Music />} size="lg" tone="amber" />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('aria-hidden 속성과 data-slot 가 부여된다', () => {
    const { container } = render(<IconTile icon={<Music />} />);
    const tile = container.querySelector('[data-slot="icon-tile"]');
    expect(tile).not.toBeNull();
    expect(tile).toHaveAttribute('aria-hidden', 'true');
  });

  it('className prop 이 병합된다', () => {
    const { container } = render(<IconTile icon={<Music />} className="custom-cls" />);
    const tile = container.querySelector('[data-slot="icon-tile"]');
    expect(tile?.className).toContain('custom-cls');
  });
});
