import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PasswordStrength, evaluatePassword } from './password-strength';

describe('evaluatePassword', () => {
  it('빈 문자열은 empty', () => {
    expect(evaluatePassword('')).toEqual({ score: 0, level: 'empty' });
  });

  it('짧은 영문만은 weak (1점: 대소문자만 부분 충족)', () => {
    // 'ab' 는 8자 미만, 대문자 없음, 숫자 없음, 특수 없음 → 0점
    expect(evaluatePassword('ab')).toEqual({ score: 0, level: 'weak' });
  });

  it('8자+대소문자+숫자 는 medium (3점)', () => {
    expect(evaluatePassword('Abcdefg1')).toEqual({ score: 3, level: 'medium' });
  });

  it('8자+대소문자+숫자+특수 는 strong (4점)', () => {
    expect(evaluatePassword('Abcdefg1!')).toEqual({ score: 4, level: 'strong' });
  });
});

describe('PasswordStrength', () => {
  it('strong 레벨 렌더 스냅샷', () => {
    const { asFragment } = render(<PasswordStrength password="Abcdefg1!" />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('빈 비밀번호는 모든 세그먼트 bg-border', () => {
    const { container } = render(<PasswordStrength password="" />);
    const segs = container.querySelectorAll('span.h-1');
    expect(segs.length).toBe(4);
    segs.forEach((s) => expect(s.className).toContain('bg-border'));
  });

  it('strong 는 4 segments 모두 bg-success', () => {
    const { container } = render(<PasswordStrength password="Abcdefg1!" />);
    const segs = container.querySelectorAll('span.h-1');
    expect(segs.length).toBe(4);
    segs.forEach((s) => expect(s.className).toContain('bg-success'));
  });

  it('progressbar aria 값이 score 와 일치', () => {
    const { container } = render(<PasswordStrength password="Abcdefg1" />);
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar?.getAttribute('aria-valuenow')).toBe('3');
    expect(bar?.getAttribute('aria-valuemax')).toBe('4');
  });
});
