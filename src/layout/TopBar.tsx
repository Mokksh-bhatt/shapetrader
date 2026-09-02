import { useLocation } from 'react-router-dom';
import { BookOpen, Flame } from 'lucide-react';
import { navItemFor } from './navItems';
import { XPBar } from './XPBar';
import { useProgressStore } from '@/store/useProgressStore';
import { useUiStore } from '@/store/useUiStore';

export function TopBar() {
  const { pathname } = useLocation();
  const item = navItemFor(pathname);
  const streak = useProgressStore((s) => s.dayStreak.current);
  const openGlossary = useUiStore((s) => s.openGlossary);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-base/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-semibold tracking-tight">{item.label}</h1>
          <p className="truncate text-[12px] text-ink-muted">{item.blurb}</p>
        </div>

        <div className="flex items-center gap-3">
          {streak > 0 ? (
            <span
              className="hidden items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] font-medium text-gold sm:inline-flex"
              title={`${streak} day learning streak`}
            >
              <Flame className="size-3.5" />
              <span className="tnum">{streak}d</span>
            </span>
          ) : null}

          <XPBar compact className="hidden w-40 sm:block lg:hidden" />

          <button
            onClick={() => openGlossary()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-2.5 py-1.5 text-[12px] text-ink-muted transition hover:border-brand/50 hover:text-ink"
            title="Open the glossary (any term, plain English)"
          >
            <BookOpen className="size-3.5" />
            <span className="hidden sm:inline">Glossary</span>
          </button>
        </div>
      </div>
    </header>
  );
}
