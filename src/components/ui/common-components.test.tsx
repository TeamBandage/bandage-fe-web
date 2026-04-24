import { render } from '@testing-library/react';
import { Users } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { EmptyPane } from '@/components/feedback/empty-pane';

import { Badge } from './badge';
import { Button } from './button';
import { Divider } from './divider';
import { RoleBadge } from './role-badge';
import { SectionTitle } from './section-title';
import { StatCard } from './stat-card';

describe('공용 컴포넌트 신규 / 보정', () => {
  it('RoleBadge(LEADER)', () => {
    const { asFragment } = render(<RoleBadge role="LEADER" />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('RoleBadge(ADMIN / MEMBER) 라벨', () => {
    const { getByText: ga } = render(<RoleBadge role="ADMIN" />);
    expect(ga('관리자')).toBeTruthy();
    const { getByText: gm } = render(<RoleBadge role="MEMBER" />);
    expect(gm('멤버')).toBeTruthy();
  });

  it('SectionTitle with action', () => {
    const { asFragment } = render(
      <SectionTitle title="내 밴드" action={<a href="#">전체 보기 →</a>} />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('Divider inset', () => {
    const { container } = render(<Divider inset />);
    const sep = container.querySelector('[role="separator"]');
    expect(sep?.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('StatCard', () => {
    const { asFragment } = render(<StatCard icon={Users} label="소속 밴드" value={3} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('EmptyPane', () => {
    const { asFragment } = render(
      <EmptyPane title="선택된 항목이 없습니다" description="왼쪽에서 항목을 선택하세요" />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('Button accent-outline variant', () => {
    const { getByRole } = render(<Button variant="accent-outline">outline</Button>);
    expect(getByRole('button').className).toContain('border-accent');
  });

  it('Badge amber / muted variant', () => {
    const { getByText } = render(
      <>
        <Badge variant="amber">amber</Badge>
        <Badge variant="muted">muted</Badge>
      </>,
    );
    expect(getByText('amber').className).toContain('bg-amber-dim');
    expect(getByText('muted').className).toContain('text-foreground-muted');
  });
});
