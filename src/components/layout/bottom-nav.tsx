'use client';

import { CalendarDays, Clock, Home, ListMusic, Music, Users, type LucideIcon } from 'lucide-react';
import { GuardedLink as Link } from '@/global/navigation/guarded-link';
import { usePathname } from 'next/navigation';

import { ROUTES } from '@/global/config/routes';
import { cn } from '@/lib/cn';

type Tab = {
  href: string;
  icon: LucideIcon;
  label: string;
};

const tabs: Tab[] = [
  { href: ROUTES.HOME, icon: Home, label: '홈' },
  { href: ROUTES.BANDS, icon: Users, label: '밴드' },
  { href: ROUTES.JAMS, icon: Music, label: '합주' },
  { href: ROUTES.PERFORMANCES, icon: CalendarDays, label: '공연' },
  { href: ROUTES.TRACK_SELECTIONS, icon: ListMusic, label: '선곡 회의' },
  { href: ROUTES.ME_SCHEDULE, icon: Clock, label: '스케줄' },
];

function isActive(pathname: string, href: string) {
  if (href === ROUTES.HOME) return pathname === ROUTES.HOME;
  if (href === ROUTES.TRACK_SELECTIONS) {
    return (
      pathname === href ||
      pathname.startsWith(`${href}/`) ||
      pathname === ROUTES.SETLISTS ||
      pathname.startsWith(`${ROUTES.SETLISTS}/`)
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname() ?? '';

  return (
    <nav
      aria-label="주 탐색"
      className="bg-surface/95 border-border fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur supports-[padding:env(safe-area-inset-bottom)]:pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex h-14 max-w-xl items-stretch justify-around">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'focus-visible:ring-accent focus-visible:ring-offset-bg flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium no-underline transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                  active ? 'text-white' : 'text-foreground-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
