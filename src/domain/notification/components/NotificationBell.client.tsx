'use client';

import { Bell, CheckCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/date';
import { ROUTES } from '@/global/config/routes';

import { useMarkAllAsRead } from '../hooks/useMarkAllAsRead';
import { useMarkAsRead } from '../hooks/useMarkAsRead';
import { useMyNotifications } from '../hooks/useMyNotifications';
import type { NotifyCategory } from '../types/res';

interface Props {
  collapsed: boolean;
  placement?: 'sidebar' | 'topbar';
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
    default:
      return null;
  }
}

export function NotificationBell({ collapsed, placement = 'sidebar' }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data: notifications = [], isLoading } = useMyNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

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
        onClick={() => setOpen((v) => !v)}
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
            <span className="bg-card border-border absolute -top-2 right-4 h-4 w-4 rotate-45 border-t border-l" />
          )}
          <div className="border-border flex items-center justify-between border-b px-4 py-3">
            <span className="text-foreground text-sm font-semibold">알림</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
                className="text-foreground-muted hover:text-foreground flex items-center gap-1 text-xs transition-colors disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                전체 읽음
              </button>
            )}
          </div>

          <ul className="flex-1 overflow-y-auto">
            {isLoading ? (
              <li className="text-foreground-muted px-4 py-8 text-center text-sm">불러오는 중…</li>
            ) : notifications.length === 0 ? (
              <li className="text-foreground-muted px-4 py-8 text-center text-sm">
                알림이 없습니다.
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
          </ul>
        </div>
      )}
    </div>
  );
}
