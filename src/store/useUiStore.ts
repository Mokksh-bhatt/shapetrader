import { create } from 'zustand';
import type { LevelInfo } from '@/engine/progress/xp';

export interface ToastItem {
  id: string;
  kind: 'xp' | 'badge' | 'success' | 'error' | 'info';
  title: string;
  detail?: string;
}

interface UiState {
  toasts: ToastItem[];
  levelUp: LevelInfo | null;
  glossaryOpen: boolean;
  glossaryQuery: string;
  pushToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
  showLevelUp: (info: LevelInfo) => void;
  clearLevelUp: () => void;
  openGlossary: (query?: string) => void;
  closeGlossary: () => void;
}

let toastSeq = 0;

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  levelUp: null,
  glossaryOpen: false,
  glossaryQuery: '',

  pushToast: (toast) => {
    toastSeq += 1;
    const id = `t${toastSeq}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }].slice(-4) }));
    window.setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4200);
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  showLevelUp: (info) => set({ levelUp: info }),
  clearLevelUp: () => set({ levelUp: null }),
  openGlossary: (query = '') => set({ glossaryOpen: true, glossaryQuery: query }),
  closeGlossary: () => set({ glossaryOpen: false }),
}));
