'use client';

import { useToastStore } from '@/global/store/toastStore';

import { Toast } from './toast';

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  return (
    <div
      aria-label="알림 영역"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[9999] flex flex-col items-center gap-2 px-4 sm:right-4 sm:left-auto sm:items-end sm:justify-end"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onDismiss={remove} />
        </div>
      ))}
    </div>
  );
}
