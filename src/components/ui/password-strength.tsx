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
  empty: '8자 이상, 대·소문자·숫자·특수문자 조합 권장',
  weak: '약함 — 8자 이상 및 대소문자/숫자/특수문자 중 2개 이상 포함 권장',
  medium: '보통 — 대소문자/숫자/특수문자 모두 포함하면 강함으로 승격',
  strong: '강함 — 안전한 비밀번호입니다',
};

const SEG_COLOR: Record<PasswordStrengthLevel, string> = {
  empty: 'bg-border',
  weak: 'bg-danger',
  medium: 'bg-warn',
  strong: 'bg-success',
};

const LABEL_COLOR: Record<PasswordStrengthLevel, string> = {
  empty: 'text-foreground-muted',
  weak: 'text-danger',
  medium: 'text-warn',
  strong: 'text-success',
};

/**
 * 비밀번호 강도 4-segment 바 + 하단 힌트.
 * design/dist/css/components.css .pw-strength 규칙 미러링.
 */
export function PasswordStrength({ password, className, onLevelChange }: PasswordStrengthProps) {
  const { score, level } = evaluatePassword(password);
  onLevelChange?.(level, score);
  const filled = level === 'empty' ? 0 : score;

  return (
    <div className={cn('-mt-s-2 mb-s-3', className)} data-slot="password-strength">
      <div
        className="flex gap-[3px]"
        role="progressbar"
        aria-label="비밀번호 강도"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={score}
      >
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              'h-1 flex-1 rounded-sm transition-colors duration-200',
              i < filled ? SEG_COLOR[level] : 'bg-border',
            )}
          />
        ))}
      </div>
      <p className={cn('text-micro mt-s-1', LABEL_COLOR[level])}>{LABEL_MAP[level]}</p>
    </div>
  );
}
