'use client';

import { useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  ResponsiveSheet,
  ResponsiveSheetBody,
  ResponsiveSheetContent,
  ResponsiveSheetTitle,
} from '@/components/ui/responsive-sheet';

import { AuthHero } from './AuthHero';

export function AuthSplit({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full" data-slot="auth-split">
      <div className="relative h-screen w-full overflow-hidden lg:h-auto lg:overflow-visible">
        <AuthHero />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-[30px] py-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/bandage_wave_text_white.png" alt="Bandage" className="h-7 w-auto" />
          <Button
            variant="secondary"
            size="sm"
            className="pointer-events-auto border border-white/20 bg-white/10 text-white/90 backdrop-blur-sm hover:bg-white/20 focus-visible:ring-0 focus-visible:ring-offset-0"
            onClick={() => setOpen(true)}
          >
            로그인
          </Button>
        </div>
      </div>

      <section
        style={{ background: '#06060a', borderTop: '1px solid rgba(255,255,255,0.1)' }}
        className="w-full px-5 py-16 lg:px-40"
      >
        <h2 className="text-xl leading-tight font-black text-white lg:text-3xl">
          선곡 회의 관리를 한 곳에서 해보세요
        </h2>
        <p
          className="mt-4 text-xs leading-relaxed lg:text-base"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          선곡 회의 참여자 추가를 하고 트랙을 추가해보세요
          <br />
          트랙 내 세션 배정과 추천자 의견을 남길 수 있습니다
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/track_selection_img.png"
          alt="선곡 목록 화면 미리보기"
          className="mt-8 w-full"
        />
      </section>

      <section
        style={{ background: '#06060a', borderTop: '1px solid rgba(255,255,255,0.1)' }}
        className="w-full px-5 py-16 lg:px-40"
      >
        <h2 className="text-right text-xl leading-tight font-black text-white lg:text-3xl">
          세션 배정과 채팅을 경험해보세요
        </h2>
        <p
          className="mt-4 text-right text-xs leading-relaxed lg:text-base"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          세션에 지원하고 매니저가 확정하면 배정이 완료돼요
          <br />
          트랙별 채팅으로 세션 의견도 실시간으로 나눠보세요
        </p>
        <div className="mt-8 flex justify-end gap-6">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/ts_session_img.png"
              alt="세션 배정 화면 미리보기"
              className="h-[170px] w-auto sm:h-[260px] lg:h-[520px]"
            />
            <p
              className="mt-2 text-center text-[10px] lg:text-xs"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              * 세션 배정 확정은 선곡 회의 매니저만 가능합니다
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/ts_chat_img.png"
            alt="채팅 화면 미리보기"
            className="h-[170px] w-auto sm:h-[260px] lg:h-[520px]"
          />
        </div>
      </section>

      <section
        style={{ background: '#06060a', borderTop: '1px solid rgba(255,255,255,0.1)' }}
        className="w-full px-5 py-16 lg:px-40"
      >
        <div className="grid grid-cols-[55%_45%] gap-3 lg:gap-4">
          <div
            className="min-h-[320px] rounded-lg p-6 sm:min-h-[420px] lg:min-h-[620px] lg:p-8"
            style={{ background: '#c9c4c4' }}
          >
            <p className="text-base leading-snug font-semibold text-neutral-900 lg:text-4xl">
              &ldquo;Into One Seamless Flow,
              <br />
              Driven By Rhythm,
              <br />
              Make It Complete.&rdquo;
            </p>
          </div>
          <div className="bg-brand flex min-h-[320px] flex-col justify-end rounded-lg p-6 sm:min-h-[420px] lg:min-h-[620px] lg:p-8">
            <p className="text-base leading-snug font-medium text-white lg:text-3xl">
              &ldquo;One of the most remarkable
              <br />
              services discovered recently.&rdquo;
            </p>
          </div>
        </div>
      </section>

      <section
        style={{ background: '#06060a', borderTop: '1px solid rgba(255,255,255,0.1)' }}
        className="w-full px-5 py-16 lg:px-40"
      >
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/20 px-6 py-16 lg:py-24">
          <h2 className="text-center text-xl leading-tight font-black text-white lg:text-3xl">
            밴드 합주 관리의 모든 것을 한 곳에
          </h2>
          <Button
            variant="secondary"
            className="rounded-full border-none bg-white px-6 text-neutral-900 hover:bg-neutral-100 focus-visible:ring-0 focus-visible:ring-offset-0"
            onClick={() => setOpen(true)}
          >
            시작하기
          </Button>
        </div>
      </section>

      <footer
        style={{ background: '#1e1e2a' }}
        className="flex w-full flex-col gap-2 px-5 py-8 lg:h-[150px] lg:flex-row lg:items-start lg:gap-6 lg:px-40"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/bandage_wave_text_white.png"
          alt="Bandage"
          className="h-7 w-auto self-start lg:h-9"
        />
        <div>
          <div className="text-xs lg:text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            문의 | bandage2026@gmail.com
          </div>
          <p className="mt-2 text-xs lg:text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            © Bandage 2026. All rights reserved.
          </p>
        </div>
      </footer>

      <ResponsiveSheet open={open} onOpenChange={setOpen}>
        <ResponsiveSheetContent
          className="max-h-[92vh] border-white/20 lg:max-h-none"
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
