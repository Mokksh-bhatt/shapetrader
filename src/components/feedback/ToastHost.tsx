import { AnimatePresence, motion } from 'framer-motion';
import { Award, Info, TriangleAlert, Check, Zap } from 'lucide-react';
import { useUiStore, type ToastItem } from '@/store/useUiStore';

const ICONS: Record<ToastItem['kind'], typeof Zap> = {
  xp: Zap,
  badge: Award,
  success: Check,
  error: TriangleAlert,
  info: Info,
};

const TONES: Record<ToastItem['kind'], string> = {
  xp: 'text-gold border-gold/40',
  badge: 'text-violet border-violet/40',
  success: 'text-bull border-bull/40',
  error: 'text-bear border-bear/40',
  info: 'text-brand border-brand/40',
};

export function ToastHost() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-[60] flex w-72 flex-col gap-2 lg:bottom-6">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.kind];
          return (
            <motion.button
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 24, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              onClick={() => dismiss(toast.id)}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-surface-2/95 p-3 text-left shadow-xl backdrop-blur ${TONES[toast.kind]}`}
            >
              <Icon className="mt-0.5 size-4 shrink-0" />
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-ink">{toast.title}</span>
                {toast.detail ? (
                  <span className="block truncate text-[11px] text-ink-muted">{toast.detail}</span>
                ) : null}
              </span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
