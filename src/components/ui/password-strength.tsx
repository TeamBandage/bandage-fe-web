import { cn } from '@/lib/cn';

export type PasswordStrengthLevel = 'empty' | 'weak' | 'medium' | 'strong';

export interface PasswordStrengthProps {
  /** 평가할 비밀번호 원문. 빈 문자열이면 모든 막대 비활성. */
  password: string;
  className?: string;
  /** 레벨이 결정될 때 상위로 알림 (폼 제출 제어 등). */
  onLevelChange?: (level: PasswordStrengthLevel, score: number) => void;
}

export function evaluatePassword(pw: string): { score: number; level: PasswordStrengthLevel } {
  if (!pw) return { score: 0, level: 'empty' };
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  const level: PasswordStrengthLevel = score <= 1 ? 'weak' : score <= 3 ? 'medium' : 'strong';
  return { score, level };
}

const LABEL_MAP: Record<PasswordStrengthLevel, string> = {
  empty: '',
  weak: '보안 약함',
  medium: '보안 보통',
  strong: '보안 강함',
};

const LABEL_COLOR: Record<PasswordStrengthLevel, string> = {
  empty: '',
  weak: 'text-danger',
  medium: 'text-warn',
  strong: 'text-success',
};

export function PasswordStrength({ password, className, onLevelChange }: PasswordStrengthProps) {
  const { score, level } = evaluatePassword(password);
  onLevelChange?.(level, score);

  if (level === 'empty') return null;

  return (
    <p className={cn('text-xs', LABEL_COLOR[level], className)} data-slot="password-strength">
      {LABEL_MAP[level]}
    </p>
  );
}
