import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warn';

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
};

type ToastInput = Omit<Toast, 'id' | 'duration'> & { duration?: number };

type ToastState = {
  toasts: Toast[];
  add: (input: ToastInput) => string;
  remove: (id: string) => void;
  clear: () => void;
};

const MAX_TOASTS = 3;
const DEFAULT_DURATION = 3000;

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: ({ type, message, duration = DEFAULT_DURATION }) => {
    const id = createId();
    set((state) => {
      const next = [...state.toasts, { id, type, message, duration }];
      return { toasts: next.slice(-MAX_TOASTS) };
    });
    return id;
  },
  remove: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));
