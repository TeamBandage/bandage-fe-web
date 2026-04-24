'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { ROUTES } from '@/global/config/routes';
import { useIsAuthenticated } from '@/global/store/authStore';

export function AuthRedirectIfAuthenticated() {
  const router = useRouter();
  const authenticated = useIsAuthenticated();

  useEffect(() => {
    if (authenticated) router.replace(ROUTES.HOME);
  }, [authenticated, router]);

  return null;
}
