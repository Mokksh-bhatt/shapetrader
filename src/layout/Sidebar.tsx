import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navItems';
import { XPBar } from './XPBar';
import { cn } from '@/lib/cn';

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      {/* A hammer candle as the mark — the first shape the app teaches. */}
      <svg width="22" height="26" viewBox="0 0 22 26" aria-hidden>
        <line x1="11" y1="2" x2="11" y2="7" stroke="var(--color-bull)" strokeWidth="2" />
        <rect x="6" y="7" width="10" height="6" rx="1.5" fill="var(--color-bull)" />
        <line x1="11" y1="13" x2="11" y2="24" stroke="var(--color-bull)" strokeWidth="2" />
      </svg>
      <div className="leading-none">
        <div className="text-[15px] font-semibold tracking-tight">ShapeTrader</div>
        <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-ink-dim">
          Learn the market
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-surface/70 backdrop-blur lg:flex">
      <div className="flex h-16 items-center border-b border-line">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition',
                isActive
                  ? 'bg-surface-2 text-ink'
                  : 'text-ink-muted hover:bg-surface-2/60 hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-brand transition-opacity',
                    isActive ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <item.icon className={cn('size-4 shrink-0', isActive && 'text-brand')} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-line p-4">
        <XPBar />
      </div>
    </aside>
  );
}
