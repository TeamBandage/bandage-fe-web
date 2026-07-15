'use client';

import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
import { useUiStore } from '@/global/store/uiStore';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';
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
    href: ROUTES.JAMS,
    label: '합주',
    icon: Music,
    subs: [
      { href: ROUTES.JAM_CREATE, label: '합주 생성' },
      { href: ROUTES.JAMS, label: '합주 목록' },
    ],
  },
  {
    href: ROUTES.PERFORMANCES,
    label: '공연',
    icon: CalendarDays,
    subs: [
      { href: ROUTES.PERFORMANCE_CREATE, label: '공연 생성' },
      { href: ROUTES.PERFORMANCES, label: '공연 목록' },
    ],
  },
  {
    href: ROUTES.TRACK_SELECTIONS,
    label: '선곡 조율',
    icon: ListMusic,
    subs: [
      { href: ROUTES.TRACK_SELECTION_CREATE, label: '선곡 생성' },
      { href: `${ROUTES.TRACK_SELECTIONS}?listOpen=1`, label: '선곡 목록' },
      { href: ROUTES.SETLISTS, label: '셋리스트 목록' },
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
  if (hrefPath === ROUTES.JAMS) return pathname === ROUTES.JAMS;
  if (hrefPath === ROUTES.PERFORMANCES) return pathname === ROUTES.PERFORMANCES;
  if (hrefPath === ROUTES.TRACK_SELECTIONS) {
    if (!pathname.startsWith(ROUTES.TRACK_SELECTIONS)) return false;
    return (
      !pathname.startsWith(ROUTES.TRACK_SELECTION_CREATE) &&
      !pathname.startsWith(ROUTES.TRACK_SELECTION_SCHEDULING)
    );
  }
  return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
}

export interface SidebarProps {
  className?: string;
}

/**
 * 데스크톱(>=960px) 좌측 네비게이션.
 * collapsed 시 아이콘만 노출, 토글 버튼으로 확장/축소 전환.
 */
export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const toast = useToast();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const { data: me, isLoading: meLoading } = useMe();

  const logoutMutation = useLogout({
    onSuccess: () => {
      toast.success('로그아웃되었습니다.');
      router.replace(ROUTES.LOGIN);
    },
    onError: (err) => toast.error(err.message || '로그아웃에 실패했습니다.'),
  });

  const collapsed = sidebarCollapsed;

  return (
    <aside
      className={cn(
        'bg-surface border-border py-s-4 gap-s-1 relative z-30 hidden shrink-0 flex-col border-r lg:flex',
        'transition-[width] duration-200 ease-in-out',
        collapsed ? 'px-s-2' : 'px-s-3',
        className,
      )}
      style={{ width: collapsed ? '72px' : 'var(--sidebar-w)' }}
      data-slot="sidebar"
      aria-label="주 탐색"
    >
      {/* 사이드바 우측 경계에 떠있는 토글 버튼 */}
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
        className={cn(
          'bg-surface border-border absolute top-[17px] -right-3.5 z-10',
          'flex h-7 w-7 items-center justify-center rounded-full border shadow-md',
          'text-foreground-muted hover:text-foreground transition-colors',
          'focus-visible:ring-accent focus-visible:ring-2 focus-visible:outline-none',
        )}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        )}
      </button>

      {/* 로고 */}
      <div
        className={cn(
          'border-border mb-s-2 pb-s-4 pt-s-1 flex items-center border-b',
          collapsed ? 'justify-center px-0' : 'px-s-2',
        )}
      >
        {collapsed ? (
          <Image
            key="collapsed-logo"
            src="/brand/bandage_pick_logo_white.png"
            alt="Bandage"
            width={18}
            height={18}
            priority
          />
        ) : (
          <Image
            key="expanded-logo"
            src="/brand/bandage_wave_text_white.png"
            alt="Bandage"
            width={100}
            height={21}
            priority
          />
        )}
      </div>

      <div
        className={`text-foreground-muted pb-s-2 pt-s-1 text-micro font-bold tracking-wider uppercase ${collapsed ? 'text-center' : 'px-s-3'}`}
      >
        {collapsed ? 'NAV' : 'Navigation'}
      </div>

      <nav className="gap-s-1 flex flex-1 flex-col">
        {mainNav.map((item) => (
          <NavRow key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
        ))}
      </nav>

      <div className="border-border mt-s-3 pt-s-3 gap-s-1 flex flex-col border-t">
        {!collapsed &&
          (meLoading ? (
            <div className="px-s-4 py-s-1 space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2.5 w-28" />
            </div>
          ) : (
            <div className="px-s-4 py-s-1 min-w-0">
              <div className="text-foreground text-caption truncate font-semibold">
                {me?.name ?? '게스트'}
              </div>
              <div className="text-foreground-muted text-micro truncate">
                {me?.email ?? '로그인이 필요합니다'}
              </div>
            </div>
          ))}
        {!collapsed && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            loading={logoutMutation.isPending}
            className="w-full rounded-[5px]"
          >
            로그아웃
          </Button>
        )}
      </div>
    </aside>
  );
}

function NavRow({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const { href, label, icon: Icon, subs } = item;
  const active = isActive(pathname, href);
  const hasSubs = subs && subs.length > 0;
  const [open, setOpen] = useState(active);

  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  const iconOnly = collapsed;

  const baseItemCls = cn(
    'gap-s-3 py-s-2 flex items-center rounded-[8px] text-[13px] font-medium transition-colors',
    'focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
    active
      ? 'bg-nav-active/30 hover:bg-nav-active/55 font-bold text-white hover:text-white'
      : 'text-foreground-sub hover:bg-card hover:text-foreground',
    iconOnly ? 'justify-center px-0 w-full' : 'px-s-3',
  );

  if (iconOnly) {
    return (
      <Link
        href={subs?.[0]?.href ?? href}
        aria-current={active ? 'page' : undefined}
        title={label}
        className={cn(baseItemCls, 'no-underline hover:no-underline')}
      >
        <Icon className="h-3.25 w-3.25 shrink-0" aria-hidden="true" />
      </Link>
    );
  }

  if (!hasSubs) {
    return (
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(baseItemCls, 'no-underline hover:no-underline')}
      >
        <Icon className="h-3.25 w-3.25 shrink-0" aria-hidden="true" />
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
        className={cn(baseItemCls, 'w-full')}
      >
        <Icon className="h-3.25 w-3.25 shrink-0" aria-hidden="true" />
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
