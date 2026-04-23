# Task ID: 4

**Title:** UI 프리미티브 컴포넌트 라이브러리 구축

**Status:** done

**Dependencies:** 2 ✓

**Priority:** high

**Description:** Button, Input, Textarea, Select, Dialog, BottomSheet, Card, Badge, Chip, Avatar, Tabs, Skeleton 등 shadcn/ui 스타일의 재사용 가능한 프리미티브 컴포넌트를 구현합니다.

**Details:**

1. src/lib/cn.ts - clsx + tailwind-merge 유틸:
```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

2. src/components/ui/button.tsx:
```tsx
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  asChild?: boolean;
}

export function Button({ variant = 'primary', size = 'md', loading, asChild, className, children, disabled, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors rounded-md disabled:opacity-50 disabled:pointer-events-none',
        // variant styles
        // size styles
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Comp>
  );
}
```

3. src/components/ui/input.tsx - error, label, hint props 포함

4. src/components/ui/textarea.tsx

5. src/components/ui/select.tsx - Radix Select 기반 또는 native select

6. src/components/ui/dialog.tsx - Radix Dialog 기반, 모바일에서는 풀스크린 옵션

7. src/components/ui/bottom-sheet.tsx - 모바일 전용 하단 시트

8. src/components/ui/card.tsx - header, footer, padding props

9. src/components/ui/badge.tsx - variant prop (default, success, warn, danger)

10. src/components/ui/chip.tsx - interactive prop, 세션 타입별 색상 지원

11. src/components/ui/avatar.tsx - src, fallback(이니셜), size props

12. src/components/ui/tabs.tsx - Radix Tabs 기반

13. src/components/ui/skeleton.tsx - w, h, rounded props

14. src/components/ui/spinner.tsx - 로딩 인디케이터

**Test Strategy:**

/playground 페이지에서 모든 컴포넌트 variant/size 조합 렌더링 확인, Vitest 스냅샷 테스트로 회귀 방지
