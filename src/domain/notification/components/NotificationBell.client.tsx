'use client';

import { Bell, CheckCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type UIEvent } from 'react';

import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/date';
import { ROUTES } from '@/global/config/routes';

import { useMarkAllAsRead } from '../hooks/useMarkAllAsRead';
import { useMarkAsRead } from '../hooks/useMarkAsRead';
import { useMyNotifications } from '../hooks/useMyNotifications';
import { useUnreadCount } from '../hooks/useUnreadCount';
import type { NotifyCategory } from '../types/res';

interface Props {
  collapsed: boolean;
  placement?: 'sidebar' | 'topbar';
  /** 외부에서 열림 상태를 제어(예: 모바일에서 프로필 메뉴와 배타적으로 하나만 열림). 미지정 시 내부 상태로 동작. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function resolveHref(category: NotifyCategory, referenceId: string): string | null {
  switch (category) {
    case 'BAND_APPLICATION':
      return `${ROUTES.BAND_DETAIL(referenceId)}?tab=applications`;
    case 'BAND_APPLICATION_RESULT':
      return ROUTES.BAND_DETAIL(referenceId);
    case 'AUTHORITY_PROMOTION':
      return `${ROUTES.BAND_DETAIL(referenceId)}?tab=members`;
    case 'JAM_UPCOMING':
      return ROUTES.JAM_DETAIL(referenceId);
    case 'JAM_PARTICIPANT_ADDED':
      return `${ROUTES.JAM_DETAIL(referenceId)}?tab=participants`;
    // JAM_CREATED: referenceId는 setlistId 지만 특정 합주 하나를 가리키지 않는 요약
    // 알림이라 셋리스트 상세 대신 합주 목록으로 보낸다.
    case 'JAM_CREATED':
      return ROUTES.JAMS;
    case 'SETLIST_CREATED':
      return ROUTES.SETLIST_DETAIL(referenceId);
    case 'PERFORMANCE_UPCOMING':
    case 'PERFORMANCE_OWNER_PROMOTED':
      return ROUTES.PERFORMANCE_DETAIL(referenceId);
    case 'PERFORMANCE_MANAGER_INVITED':
      return `${ROUTES.PERFORMANCE_DETAIL(referenceId)}?tab=invitations`;
    case 'SELECTION_PARTICIPANT_ADDED':
      return ROUTES.TRACK_SELECTION_DETAIL(referenceId);
    default:
      return null;
  }
}

export function NotificationBell({
  collapsed,
  placement = 'sidebar',
  open: openProp,
  onOpenChange,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = onOpenChange ? (openProp ?? false) : internalOpen;
  const setOpen = useCallback(
    (value: boolean) => (onOpenChange ? onOpenChange(value) : setInternalOpen(value)),
    [onOpenChange],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMyNotifications(true);
  const notifications = data?.pages.flatMap((p) => p.content) ?? [];
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  // 프론트에서 페이지네이션된 목록을 세는 건 부정확 — 전용 API로 정확한 미확인 개수를 받는다.
  const { data: unreadCountData } = useUnreadCount();
  const unreadCount = unreadCountData?.count ?? 0;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, setOpen]);

  function handleScroll(e: UIEvent<HTMLUListElement>) {
    if (!hasNextPage || isFetchingNextPage) return;
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
      fetchNextPage();
    }
  }

  function handleNotificationClick(
    notificationId: string,
    category: NotifyCategory,
    referenceId: string,
    read: boolean,
  ) {
    if (!read) markAsRead.mutate(notificationId);
    const href = resolveHref(category, referenceId);
    if (href) {
      setOpen(false);
      router.push(href);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="알림"
        aria-expanded={open}
        className={cn(
          'relative flex items-center rounded-[8px] font-medium transition-colors',
          'focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          open
            ? 'bg-card text-foreground'
            : 'text-foreground-sub hover:bg-card hover:text-foreground',
          placement === 'topbar'
            ? 'h-[20px] w-[20px] justify-center'
            : cn(
                'gap-s-3 py-s-2 text-caption w-full',
                collapsed ? 'justify-center px-0' : 'px-s-3',
              ),
        )}
      >
        <span className="relative shrink-0">
          <Bell
            className={placement === 'topbar' ? 'h-5 w-5' : 'h-3.25 w-3.25'}
            aria-hidden="true"
          />
          {unreadCount > 0 && (
            <span className="bg-accent absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[10px] leading-none font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </span>
        {placement === 'sidebar' && !collapsed && <span className="truncate">알림</span>}
      </button>

      {open && (
        <div
          className={cn(
            'bg-card border-border absolute z-50 flex flex-col rounded-xl border shadow-xl',
            placement === 'topbar' ? 'top-full -right-[15px] mt-3' : 'bottom-0 left-full ml-3',
            'w-80',
            'max-h-120',
          )}
          role="dialog"
          aria-label="알림 패널"
        >
          {placement === 'topbar' && (
            <span className="border-b-card absolute -top-2 right-4 h-0 w-0 border-x-8 border-b-8 border-x-transparent" />
          )}
          <div className="border-border flex items-center justify-between gap-2 border-b px-4 py-3">
            <span className="text-foreground text-sm font-semibold">알림</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
                className="text-foreground-muted hover:text-foreground flex shrink-0 items-center gap-1 text-xs transition-colors disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                전체 읽음
              </button>
            )}
          </div>

          <ul className="flex-1 overflow-y-auto" onScroll={handleScroll}>
            {isLoading ? (
              <li className="text-foreground-muted px-4 py-8 text-center text-sm">불러오는 중…</li>
            ) : notifications.length === 0 ? (
              <li className="text-foreground-muted px-4 py-8 text-center text-sm">
                읽지 않은 알림이 없습니다.
              </li>
            ) : (
              notifications.map((n) => {
                const href = resolveHref(n.category, n.referenceId);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() =>
                        handleNotificationClick(n.id, n.category, n.referenceId, n.read)
                      }
                      className={cn(
                        'border-border flex w-full items-start gap-3 border-b px-4 py-3 text-left last:border-b-0',
                        'hover:bg-card-hover transition-colors',
                        !n.read && 'bg-surface',
                        href ? 'cursor-pointer' : 'cursor-default',
                      )}
                    >
                      <div className="mt-1.5 shrink-0">
                        {!n.read ? (
                          <span
                            className="bg-accent block h-2 w-2 rounded-full"
                            aria-hidden="true"
                          />
                        ) : (
                          <span className="block h-2 w-2" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'text-sm leading-snug',
                            n.read ? 'text-foreground-muted' : 'text-foreground',
                          )}
                        >
                          {n.message}
                        </p>
                        <p className="text-foreground-muted mt-0.5 text-xs">
                          {formatRelative(new Date(n.createdAt))}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })
            )}
            {isFetchingNextPage && (
              <li className="text-foreground-muted px-4 py-3 text-center text-xs">불러오는 중…</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
