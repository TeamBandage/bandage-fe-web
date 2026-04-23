import type { Metadata } from 'next';

import { PasswordChangeForm } from './PasswordChangeForm.client';

export const metadata: Metadata = {
  title: '비밀번호 변경 | Bandage',
};

export default function PasswordChangePage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1 text-center">
        <h1 className="text-foreground text-2xl font-bold">비밀번호 변경</h1>
        <p className="text-foreground-sub text-sm">
          보안을 위해 다른 서비스와 구분되는 비밀번호를 사용하세요.
        </p>
      </header>
      <PasswordChangeForm />
    </div>
  );
}
