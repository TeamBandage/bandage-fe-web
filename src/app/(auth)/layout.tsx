import type { ReactNode } from 'react';

import { AuthSplit } from '@/components/layout/auth-split';

import { AuthRedirectIfAuthenticated } from './AuthRedirectIfAuthenticated.client';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthSplit>
      <AuthRedirectIfAuthenticated />
      {children}
    </AuthSplit>
  );
}
