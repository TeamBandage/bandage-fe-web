'use client';

import { useCallback } from 'react';

import { useToastStore, type ToastType } from '@/global/store/toastStore';

export function useToast() {
  const add = useToastStore((s) => s.add);
  const remove = useToastStore((s) => s.remove);
  const clear = useToastStore((s) => s.clear);

  const show = useCallback(
    (type: ToastType, message: string, duration?: number) => add({ type, message, duration }),
    [add],
  );

  const success = useCallback(
    (message: string, duration?: number) => show('success', message, duration),
    [show],
  );
  const error = useCallback(
    (message: string, duration?: number) => show('error', message, duration),
    [show],
  );
  const info = useCallback(
    (message: string, duration?: number) => show('info', message, duration),
    [show],
  );
  const warn = useCallback(
    (message: string, duration?: number) => show('warn', message, duration),
    [show],
  );

  /**
   * 시스템 전역 리소스 생성 표준 알림. success 토스트의 강조판 (5초 지속).
   * 사용 예: toast.resourceCreated('합주', { name: '5월 1주차' })
   */
  const resourceCreated = useCallback(
    (kind: string, opts?: { name?: string }) => {
      const label = opts?.name ? `${kind} '${opts.name}'` : kind;
      return show('success', `${label} 가(이) 생성되었습니다.`, 5000);
    },
    [show],
  );

  return { success, error, info, warn, show, dismiss: remove, clear, resourceCreated };
}
