'use client';

import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';

import { ROUTES } from '@/global/config/routes';

export default function JamsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const isRoot = pathname === ROUTES.JAMS;

  return <div className={isRoot ? 'h-full' : 'h-full overflow-y-auto'}>{children}</div>;
}
