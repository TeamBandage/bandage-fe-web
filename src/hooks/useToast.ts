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

  return { success, error, info, warn, show, dismiss: remove, clear };
}
