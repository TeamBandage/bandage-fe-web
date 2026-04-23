import type { ReactNode } from 'react';

import { AuthRedirectIfAuthenticated } from './AuthRedirectIfAuthenticated.client';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <AuthRedirectIfAuthenticated />
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
