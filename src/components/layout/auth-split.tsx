'use client';

import { useState, type ReactNode } from 'react';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  ResponsiveSheet,
  ResponsiveSheetBody,
  ResponsiveSheetContent,
  ResponsiveSheetTitle,
} from '@/components/ui/responsive-sheet';
import { ROUTES } from '@/global/config/routes';

import { HeroCinematic } from './HeroCinematic.client';

export function AuthSplit({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="relative h-screen w-full overflow-hidden" data-slot="auth-split">
      <HeroCinematic />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/bandage_wave_text_white.png" alt="Bandage" className="h-7 w-auto" />
        <Button
          variant="secondary"
          size="sm"
          className="pointer-events-auto border border-white/20 bg-white/10 text-white/90 backdrop-blur-sm hover:bg-white/20"
          onClick={() => {
            router.push(ROUTES.LOGIN);
            setOpen(true);
          }}
        >
          로그인
        </Button>
      </div>

      <ResponsiveSheet open={open} onOpenChange={setOpen}>
        <ResponsiveSheetContent
          className="max-h-[92vh] border-white/20"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <ResponsiveSheetTitle className="sr-only">로그인</ResponsiveSheetTitle>
          <ResponsiveSheetBody className="overflow-y-auto px-5 py-6">
            {children}
          </ResponsiveSheetBody>
        </ResponsiveSheetContent>
      </ResponsiveSheet>
    </div>
  );
}
