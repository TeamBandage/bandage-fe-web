import type { Metadata } from 'next';
import Link from 'next/link';

import { ROUTES } from '@/global/config/routes';

import { LoginForm } from './login/LoginForm.client';
import { OAuthSection } from './login/OAuthSection.client';

export const metadata: Metadata = {
  title: 'Bandage',
};

export default function RootPage() {
  return (
    <div className="space-y-s-6">
      <header className="space-y-1 text-center">
        <h1 className="text-foreground text-2xl font-bold">로그인</h1>
        <p className="text-foreground-muted text-sm">밴드 합주 관리를 간편하게 시작하세요</p>
      </header>
      <LoginForm />
      <div className="gap-s-3 flex items-center" aria-hidden="true">
        <span className="bg-border h-px flex-1" />
        <span className="text-foreground-muted text-micro">또는</span>
        <span className="bg-border h-px flex-1" />
      </div>
      <OAuthSection />
      <p className="text-foreground-sub text-center text-sm">
        아직 계정이 없으신가요?{' '}
        <Link
          href={ROUTES.JOIN}
          className="cursor-pointer font-medium text-white hover:no-underline"
        >
          회원가입
        </Link>
      </p>
    </div>
  );
}
