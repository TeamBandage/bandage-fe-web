'use client';

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useEffect } from 'react';

import { cn } from '@/lib/cn';
import type { Toast as ToastModel, ToastType } from '@/global/store/toastStore';

type Props = {
  toast: ToastModel;
  onDismiss: (id: string) => void;
};

const typeStyles: Record<ToastType, { icon: typeof CheckCircle2; ring: string; text: string }> = {
  success: { icon: CheckCircle2, ring: 'border-success/40', text: 'text-success' },
  error: { icon: XCircle, ring: 'border-danger/40', text: 'text-danger' },
  info: { icon: Info, ring: 'border-accent/40', text: 'text-accent-hi' },
  warn: { icon: AlertTriangle, ring: 'border-warn/40', text: 'text-warn' },
};

export function Toast({ toast, onDismiss }: Props) {
  const { icon: Icon, ring, text } = typeStyles[toast.type];

  useEffect(() => {
    if (!toast.duration) return;
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'bg-card text-foreground animate-toast-in flex w-80 max-w-full items-start gap-3 rounded-md border px-4 py-3 shadow-lg',
        ring,
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', text)} aria-hidden="true" />
      <p className="flex-1 text-sm leading-5">{toast.message}</p>
      <button
        type="button"
        aria-label="알림 닫기"
        onClick={() => onDismiss(toast.id)}
        className="text-foreground-muted hover:text-foreground focus-visible:ring-accent focus-visible:ring-offset-bg -mt-1 -mr-1 rounded-sm p-1 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
