'use client';

import {
  CalendarDays,
  ChevronDown,
  Guitar,
  Home,
  Music,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useMe } from '@/domain/member/hooks/useMe';
import { ROUTES } from '@/global/config/routes';
import { cn } from '@/lib/cn';

import { Avatar } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';

type SubItem = { href: string; label: string };

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** 서브 메뉴 — 부모 항목 클릭 시 첫 서브로 이동, 활성 시 자동 펼침. */
  subs?: SubItem[];
};

const mainNav: NavItem[] = [
  { href: ROUTES.HOME, label: '홈', icon: Home },
  { href: ROUTES.BANDS, label: '밴드', icon: Users },
  {
    href: ROUTES.PRACTICES,
    label: '합주',
    icon: Music,
    subs: [
      { href: ROUTES.PRACTICES, label: '나의 합주' },
      { href: ROUTES.PRACTICE_NEW, label: '합주 시작하기' },
    ],
  },
  { href: ROUTES.PERFORMANCES, label: '공연', icon: CalendarDays },
  { href: ROUTES.ME, label: '마이페이지', icon: User },
];

function isActive(pathname: string, href: string) {
  if (href === ROUTES.HOME) return pathname === ROUTES.HOME;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isSubActive(pathname: string, href: string) {
  // 정확 매칭 — `/practices` vs `/practices/new` 가 둘 다 매칭되지 않도록.
  if (href === ROUTES.PRACTICES) return pathname === ROUTES.PRACTICES;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface SidebarProps {
  className?: string;
}

/**
 * 데스크톱(>=960px) 좌측 네비게이션.
 * design/dist/css/layout.css 의 .sidebar / .nav-item 규칙과 구조적으로 1:1 대응.
 * lg 미만에서는 hidden. 모바일은 BottomNav 가 대체.
 */
export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname() ?? '';
  const { data: me, isLoading: meLoading } = useMe();

  return (
    <aside
      className={cn(
        'bg-surface border-border py-s-5 px-s-4 gap-s-1 hidden shrink-0 flex-col border-r lg:flex',
        className,
      )}
      style={{ width: 'var(--sidebar-w)' }}
      data-slot="sidebar"
      aria-label="주 탐색"
    >
      <div className="border-border mb-s-3 gap-s-3 pb-s-5 px-s-2 pt-s-1 flex items-center border-b">
        <span
          className="bg-accent-dim flex h-10 w-10 items-center justify-center rounded-md border"
          style={{ borderColor: 'oklch(0.62 0.22 250 / 0.2)' }}
          aria-hidden="true"
        >
          <Guitar className="text-accent h-[22px] w-[22px]" />
        </span>
        <span className="text-accent text-title font-black tracking-tight">Bandage</span>
      </div>

      <div className="text-foreground-muted px-s-3 pb-s-3 pt-s-2 text-micro font-bold tracking-wider uppercase">
        Navigation
      </div>
      <nav className="gap-s-1 flex flex-1 flex-col">
        {mainNav.map((item) => (
          <NavRow key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      <div className="border-border mt-s-3 gap-s-2 pt-s-3 flex items-center border-t">
        {meLoading ? (
          <div
            className="gap-s-2 px-s-2 py-s-2 flex min-w-0 flex-1 items-center"
            aria-label="사용자 정보 로딩 중"
          >
            <Skeleton rounded="pill" className="h-8 w-8 shrink-0" />
            <div className="min-w-0 flex-1 space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2.5 w-28" />
            </div>
          </div>
        ) : (
          <Link
            href={ROUTES.ME}
            className="hover:bg-card gap-s-2 px-s-2 py-s-2 flex min-w-0 flex-1 items-center rounded-md transition-colors"
            aria-label="마이페이지로 이동"
          >
            <Avatar size="md" fallback={me?.name ?? me?.email ?? '게스트'} />
            <div className="min-w-0 flex-1">
              <div className="text-foreground text-caption truncate font-semibold">
                {me?.name ?? '게스트'}
              </div>
              <div className="text-foreground-muted text-micro truncate">
                {me?.email ?? '로그인이 필요합니다'}
              </div>
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
}

function NavRow({ item, pathname }: { item: NavItem; pathname: string }) {
  const { href, label, icon: Icon, subs } = item;
  const active = isActive(pathname, href);
  const hasSubs = subs && subs.length > 0;
  const [open, setOpen] = useState(active);

  // 경로 변경 시 활성 상태에 따라 자동 펼침.
  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  if (!hasSubs) {
    return (
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'gap-s-4 px-s-4 py-s-3 text-body flex items-center rounded-md font-medium transition-colors',
          'focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          active
            ? 'bg-accent-dim text-accent font-bold'
            : 'text-foreground-sub hover:bg-card hover:text-foreground',
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'gap-s-4 px-s-4 py-s-3 text-body flex w-full items-center rounded-md font-medium transition-colors',
          'focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          active
            ? 'bg-accent-dim text-accent font-bold'
            : 'text-foreground-sub hover:bg-card hover:text-foreground',
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        <span className="flex-1 truncate text-left">{label}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      {open && (
        <ul className="mt-s-1 ml-s-6 gap-s-1 flex flex-col">
          {subs!.map((s) => {
            const subActive = isSubActive(pathname, s.href);
            return (
              <li key={s.href}>
                <Link
                  href={s.href}
                  aria-current={subActive ? 'page' : undefined}
                  className={cn(
                    'px-s-3 py-s-2 text-caption block rounded-md transition-colors',
                    'focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                    subActive
                      ? 'text-accent font-semibold'
                      : 'text-foreground-muted hover:bg-card hover:text-foreground',
                  )}
                >
                  {s.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
