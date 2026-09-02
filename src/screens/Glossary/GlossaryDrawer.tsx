import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { GlossaryList } from './GlossaryList';
import { useUiStore } from '@/store/useUiStore';

/** Jargon lookup without losing your place in a lesson. */
export function GlossaryDrawer() {
  const open = useUiStore((s) => s.glossaryOpen);
  const query = useUiStore((s) => s.glossaryQuery);
  const close = useUiStore((s) => s.closeGlossary);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-base p-5"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold tracking-tight">Glossary</h2>
                <p className="text-[12px] text-ink-muted">Plain-English definitions, no finance degree needed.</p>
              </div>
              <button
                onClick={close}
                aria-label="Close glossary"
                className="rounded-md p-1.5 text-ink-muted transition hover:bg-surface-2 hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>
            <GlossaryList initialQuery={query} dense />
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
