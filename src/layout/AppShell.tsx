import { NavLink, Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { NAV_ITEMS } from './navItems';
import { ToastHost } from '@/components/feedback/ToastHost';
import { LevelUpModal } from '@/components/feedback/LevelUpModal';
import { GlossaryDrawer } from '@/screens/Glossary/GlossaryDrawer';
import { cn } from '@/lib/cn';

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden">
      <div className="flex items-stretch justify-around">
        {NAV_ITEMS.filter((i) => i.inBottomNav).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition',
                isActive ? 'text-brand' : 'text-ink-dim',
              )
            }
          >
            <item.icon className="size-[18px]" />
            {item.shortLabel}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function AppShell() {
  return (
    <div className="grain min-h-screen bg-base">
      <Sidebar />
      <div className="lg:pl-60">
        <TopBar />
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 lg:pb-12">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <ToastHost />
      <LevelUpModal />
      <GlossaryDrawer />
    </div>
  );
}
