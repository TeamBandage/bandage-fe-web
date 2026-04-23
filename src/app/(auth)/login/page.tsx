import type { Metadata } from 'next';
import Link from 'next/link';

import { ROUTES } from '@/global/config/routes';

import { LoginForm } from './LoginForm.client';

export const metadata: Metadata = {
  title: '로그인 | Bandage',
};

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1 text-center">
        <h1 className="text-foreground text-2xl font-bold">로그인</h1>
        <p className="text-foreground-sub text-sm">Bandage 계정으로 로그인하세요.</p>
      </header>
      <LoginForm />
      <p className="text-foreground-sub text-center text-sm">
        아직 계정이 없으신가요?{' '}
        <Link href={ROUTES.JOIN} className="text-accent-hi font-medium hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}
