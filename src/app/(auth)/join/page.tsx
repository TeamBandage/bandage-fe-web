import type { Metadata } from 'next';
import Link from 'next/link';

import { ROUTES } from '@/global/config/routes';

import { JoinForm } from './JoinForm.client';

export const metadata: Metadata = {
  title: '회원가입 | Bandage',
};

export default function JoinPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1 text-center">
        <h1 className="text-foreground text-2xl font-bold">회원가입</h1>
        <p className="text-foreground-muted text-sm">Bandage 계정을 생성합니다</p>
      </header>
      <JoinForm />
      <p className="text-foreground-sub text-center text-sm">
        이미 계정이 있으신가요?{' '}
        <Link
          href={ROUTES.LOGIN}
          className="cursor-pointer font-medium text-white hover:no-underline"
        >
          로그인
        </Link>
      </p>
    </div>
  );
}
