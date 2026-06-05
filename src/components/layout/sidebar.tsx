'use client';

import {
  CalendarDays,
  ChevronDown,
  Home,
  ListMusic,
  Music,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { GuardedLink as Link } from '@/global/navigation/guarded-link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useLogout } from '@/domain/auth/hooks/useLogout';
import { useMe } from '@/domain/member/hooks/useMe';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';
import { Avatar } from '../ui/avatar';
import { Button } from '../ui/button';
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
  {
    href: ROUTES.PERFORMANCES,
    label: '공연',
    icon: CalendarDays,
    subs: [
      { href: ROUTES.PERFORMANCES, label: '나의 공연' },
      { href: ROUTES.PERFORMANCE_NEW, label: '공연 생성' },
    ],
  },
  {
    href: ROUTES.SETLIST_MEETINGS,
    label: '선곡 회의',
    icon: ListMusic,
    subs: [
      { href: `${ROUTES.SETLIST_MEETINGS}?listOpen=1`, label: '나의 선곡 회의' },
      { href: ROUTES.SETLIST_MEETING_NEW, label: '회의 만들기' },
      { href: ROUTES.SETLIST_SCHEDULING, label: '합주 일정 조율' },
    ],
  },
  { href: ROUTES.ME, label: '마이페이지', icon: User },
];

function isActive(pathname: string, href: string) {
  if (href === ROUTES.HOME) return pathname === ROUTES.HOME;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isSubActive(pathname: string, href: string) {
  const hrefPath = href.split('?')[0];
  // 정확 매칭 — 부모 경로와 자식(/new 등)이 동시에 매칭되지 않도록.
  if (hrefPath === ROUTES.PRACTICES) return pathname === ROUTES.PRACTICES;
  if (hrefPath === ROUTES.PERFORMANCES) return pathname === ROUTES.PERFORMANCES;
  if (hrefPath === ROUTES.SETLIST_MEETINGS) {
    if (!pathname.startsWith(ROUTES.SETLIST_MEETINGS)) return false;
    return (
      !pathname.startsWith(ROUTES.SETLIST_MEETING_NEW) &&
      !pathname.startsWith(ROUTES.SETLIST_SCHEDULING)
    );
  }
  return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
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
  const router = useRouter();
  const toast = useToast();
  const { data: me, isLoading: meLoading } = useMe();

  const logoutMutation = useLogout({
    onSuccess: () => {
      toast.success('로그아웃되었습니다.');
      router.replace(ROUTES.LOGIN);
    },
    onError: (err) => toast.error(err.message || '로그아웃에 실패했습니다.'),
  });

  return (
    <aside
      className={cn(
        'bg-surface border-border py-s-4 px-s-3 gap-s-1 hidden shrink-0 flex-col border-r lg:flex',
        className,
      )}
      style={{ width: 'var(--sidebar-w)' }}
      data-slot="sidebar"
      aria-label="주 탐색"
    >
      <div className="border-border mb-s-2 pb-s-4 px-s-2 pt-s-1 flex items-center border-b">
        <Image
          src="/brand/bandage_wave_text_white.png"
          alt="Bandage"
          width={100}
          height={21}
          priority
        />
      </div>

      <div className="text-foreground-muted px-s-3 pb-s-2 pt-s-1 text-micro font-bold tracking-wider uppercase">
        Navigation
      </div>
      <nav className="gap-s-1 flex flex-1 flex-col">
        {mainNav.map((item) => (
          <NavRow key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      <div className="border-border mt-s-3 pt-s-3 gap-s-1 flex flex-col border-t">
        {meLoading ? (
          <div
            className="gap-s-2 px-s-2 py-s-2 flex min-w-0 items-center"
            aria-label="사용자 정보 로딩 중"
          >
            <Skeleton rounded="pill" className="h-8 w-8 shrink-0" />
            <div className="min-w-0 flex-1 space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2.5 w-28" />
            </div>
          </div>
        ) : (
          <div className="gap-s-2 px-s-2 py-s-1 flex min-w-0 items-center">
            <Avatar
              src={me?.profileImg ?? undefined}
              fallback={me?.name ?? me?.email ?? '게스트'}
              className="h-[30px] w-[30px] shrink-0 text-xs"
            />
            <div className="min-w-0 flex-1">
              <div className="text-foreground text-caption truncate font-semibold">
                {me?.name ?? '게스트'}
              </div>
              <div className="text-foreground-muted text-micro truncate">
                {me?.email ?? '로그인이 필요합니다'}
              </div>
            </div>
          </div>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => logoutMutation.mutate()}
          loading={logoutMutation.isPending}
          className="w-full rounded-[5px]"
        >
          로그아웃
        </Button>
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
          'gap-s-3 px-s-3 py-s-2 flex items-center rounded-[8px] text-[13px] font-medium no-underline transition-colors hover:no-underline',
          'focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          active
            ? 'bg-nav-active/30 hover:bg-nav-active/55 font-bold text-white hover:text-white'
            : 'text-foreground-sub hover:bg-card hover:text-foreground',
        )}
      >
        <Icon className="h-[13px] w-[13px] shrink-0" aria-hidden="true" />
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
          'gap-s-3 px-s-3 py-s-2 flex w-full items-center rounded-[8px] text-[13px] font-medium transition-colors',
          'focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          active
            ? 'bg-nav-active/30 hover:bg-nav-active/55 font-bold text-white hover:text-white'
            : 'text-foreground-sub hover:bg-card hover:text-foreground',
        )}
      >
        <Icon className="h-[13px] w-[13px] shrink-0" aria-hidden="true" />
        <span className="flex-1 truncate text-left">{label}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      {open && (
        <ul className="mt-s-1 ml-s-5 flex flex-col gap-0.5">
          {subs!.map((s) => {
            const subActive = isSubActive(pathname, s.href);
            return (
              <li key={s.href}>
                <Link
                  href={s.href}
                  aria-current={subActive ? 'page' : undefined}
                  className={cn(
                    'px-s-3 block rounded-[8px] py-1 text-[13px] no-underline transition-colors hover:no-underline',
                    'focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                    subActive
                      ? 'font-semibold text-white'
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
