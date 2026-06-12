import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PasswordStrength, evaluatePassword } from './password-strength';

describe('evaluatePassword', () => {
  it('빈 문자열은 empty', () => {
    expect(evaluatePassword('')).toEqual({ score: 0, level: 'empty' });
  });

  it('짧은 영문만은 weak (1점: 대소문자만 부분 충족)', () => {
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

  it('빈 비밀번호는 아무것도 렌더하지 않음', () => {
    const { container } = render(<PasswordStrength password="" />);
    expect(container.firstChild).toBeNull();
  });

  it('strong 는 text-success 텍스트로 렌더', () => {
    const { container } = render(<PasswordStrength password="Abcdefg1!" />);
    const el = container.querySelector('[data-slot="password-strength"]');
    expect(el).not.toBeNull();
    expect(el?.className).toContain('text-success');
    expect(el?.textContent).toBe('보안 강함');
  });

  it('medium 는 text-warn 텍스트로 렌더', () => {
    const { container } = render(<PasswordStrength password="Abcdefg1" />);
    const el = container.querySelector('[data-slot="password-strength"]');
    expect(el?.className).toContain('text-warn');
    expect(el?.textContent).toBe('보안 보통');
  });

  it('weak 는 text-danger 텍스트로 렌더', () => {
    const { container } = render(<PasswordStrength password="abc" />);
    const el = container.querySelector('[data-slot="password-strength"]');
    expect(el?.className).toContain('text-danger');
    expect(el?.textContent).toBe('보안 약함');
  });
});
