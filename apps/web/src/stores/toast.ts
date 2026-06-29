import { create } from 'zustand';

interface Toast {
  type: 'success' | 'error';
  msg: string;
}

interface ToastState {
  toast: Toast | null;
  show: (type: 'success' | 'error', msg: string) => void;
  hide: () => void;
}

let timer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  show: (type, msg) => {
    if (timer) clearTimeout(timer);
    set({ toast: { type, msg } });
    timer = setTimeout(() => set({ toast: null }), 3500);
  },
  hide: () => {
    if (timer) clearTimeout(timer);
    set({ toast: null });
  },
}));
