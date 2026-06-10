'use client';

import { useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { BottomSheet, BottomSheetBody, BottomSheetContent } from '@/components/ui/bottom-sheet';

import { HeroCinematic } from './HeroCinematic.client';

/**
 * Auth 전체 shell: 3D 씬 전체화면 + 상단 로그인 버튼 오버레이 + BottomSheet 폼.
 */
export function AuthSplit({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative h-screen w-full overflow-hidden" data-slot="auth-split">
      <HeroCinematic />

      {/* Top-right login button overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-end px-6 py-5">
        <Button
          variant="secondary"
          size="sm"
          className="pointer-events-auto border border-white/20 bg-white/10 text-white/90 backdrop-blur-sm hover:bg-white/20"
          onClick={() => setOpen(true)}
        >
          로그인
        </Button>
      </div>

      <BottomSheet open={open} onOpenChange={setOpen}>
        <BottomSheetContent className="max-h-[92vh]">
          <BottomSheetBody className="overflow-y-auto px-5 py-6">{children}</BottomSheetBody>
        </BottomSheetContent>
      </BottomSheet>
    </div>
  );
}
