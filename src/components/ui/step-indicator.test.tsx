import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StepIndicator } from './step-indicator';

const STEPS = ['기본 정보', '계정 설정'] as const;

describe('StepIndicator', () => {
  it('current=0: 첫 단계 active, 두번째 pending', () => {
    const { asFragment } = render(<StepIndicator steps={STEPS} current={0} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('current=1: 첫 단계 done(체크), 두번째 active', () => {
    const { asFragment } = render(<StepIndicator steps={STEPS} current={1} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('active 단계는 aria-current="step" 를 가진다', () => {
    const { container } = render(<StepIndicator steps={STEPS} current={0} />);
    const activeEls = container.querySelectorAll('[aria-current="step"]');
    expect(activeEls.length).toBe(1);
  });
});
