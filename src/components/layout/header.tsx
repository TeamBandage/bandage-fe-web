'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

type HeaderProps = {
  title?: ReactNode;
  left?: ReactNode | false;
  right?: ReactNode;
  className?: string;
};

function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="뒤로 가기"
      className="text-foreground-sub hover:text-foreground focus-visible:ring-accent focus-visible:ring-offset-bg -ml-1 rounded-sm p-1 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
  );
}

export function Header({ title, left, right, className }: HeaderProps) {
  const leftNode = left === undefined ? <BackButton /> : left === false ? null : left;

  return (
    <header
      className={cn(
        'bg-surface/95 border-border sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4 backdrop-blur',
        className,
      )}
    >
      <div className="flex w-10 shrink-0 items-center">{leftNode}</div>
      <div className="text-foreground flex-1 truncate text-center text-sm font-semibold">
        {title}
      </div>
      <div className="flex w-10 shrink-0 items-center justify-end">{right}</div>
    </header>
  );
}
