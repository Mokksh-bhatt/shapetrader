import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftRight,
  BookOpen,
  Eye,
  Flame,
  History,
  Lock,
  RotateCcw,
  Shapes,
  ShieldCheck,
  TrendingUp,
  Triangle,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { BADGES } from '@/engine/progress/badges';
import { levelForXp } from '@/engine/progress/xp';
import { summarizeModules } from '@/engine/progress/summary';
import { useProgressStore } from '@/store/useProgressStore';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/cn';

const BADGE_ICONS = {
  Flame,
  Shapes,
  Triangle,
  Eye,
  BookOpen,
  History,
  ArrowLeftRight,
  ShieldCheck,
  TrendingUp,
  Trophy,
} as const;

export function DashboardScreen() {
  const state = useProgressStore();
  const resetProgress = useProgressStore((s) => s.resetProgress);
  const pushToast = useUiStore((s) => s.pushToast);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const level = levelForXp(state.xp);
  const modules = summarizeModules(state);
  const answered = Object.values(state.modules).reduce((sum, m) => sum + m.attempted, 0);
  const correct = Object.values(state.modules).reduce((sum, m) => sum + m.correct, 0);
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : null;
  const earned = BADGES.filter((b) => Boolean(state.badges[b.id]));

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });

  return (
    <div className="animate-rise space-y-5">
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-6">
            <ProgressRing value={level.progress} size={104} stroke={8}>
              <div className="text-center">
                <div className="tnum text-2xl font-bold leading-none">{level.level}</div>
                <div className="text-[9px] uppercase tracking-widest text-ink-dim">
                  of {level.maxLevel}
                </div>
              </div>
            </ProgressRing>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold tracking-tight">{level.title}</h2>
              <p className="tnum mt-1 text-[13px] text-ink-muted">{state.xp} XP total</p>
              <p className="mt-2 max-w-md text-[12.5px] leading-relaxed text-ink-dim">
                {level.xpToNext === null
                  ? 'Top rank reached. Every module in the app has been worked through.'
                  : `${level.xpToNext} XP to the next rank. Correct answers pay 10, a wrong one still pays 2 — you only stop earning if you stop practising.`}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4">
            <Stat label="Questions" value={String(answered)} />
            <Stat label="Accuracy" value={accuracy === null ? '—' : `${accuracy}%`} />
            <Stat label="Best run" value={`${state.bestAnswerStreak} in a row`} />
            <Stat label="Trades closed" value={String(state.trading.closed)} />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Learning streak"
            subtitle="A day counts once you earn any XP"
            icon={<Flame className="size-4" />}
          />
          <div className="flex items-baseline gap-2">
            <span className="tnum text-3xl font-bold text-gold">{state.dayStreak.current}</span>
            <span className="text-[12px] text-ink-muted">
              day{state.dayStreak.current === 1 ? '' : 's'} · best {state.dayStreak.longest}
            </span>
          </div>
          <div className="mt-4 flex gap-1">
            {last14.map((day) => {
              const active = state.dayStreak.activeDays.includes(day);
              return (
                <span
                  key={day}
                  title={day}
                  className={cn(
                    'h-7 flex-1 rounded-[3px] border',
                    active ? 'border-gold/50 bg-gold/35' : 'border-line bg-surface-2',
                  )}
                />
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-ink-dim">Last 14 days</p>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Missions" subtitle="Where you are on your run" />
          <div className="space-y-3">
            {modules.map((m) => (
              <Link
                key={m.id}
                to={m.route}
                className="block rounded-lg border border-line bg-surface-2/50 p-3 transition hover:border-line-strong"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] font-medium text-ink">{m.title}</span>
                  <span className="tnum text-[11px] text-ink-dim">{m.detail}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className={cn('h-full rounded-full', m.done ? 'bg-bull' : 'bg-brand')}
                    style={{ width: `${Math.max(Math.min(m.progress, 1) * 100, 2)}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Badges"
            subtitle={`${earned.length} of ${BADGES.length} unlocked`}
            icon={<Trophy className="size-4" />}
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {BADGES.map((badge) => {
              const Icon = BADGE_ICONS[badge.icon as keyof typeof BADGE_ICONS] ?? Trophy;
              const unlocked = Boolean(state.badges[badge.id]);
              return (
                <div
                  key={badge.id}
                  title={badge.requirement}
                  className={cn(
                    'rounded-lg border p-3 text-center transition',
                    unlocked
                      ? 'border-violet/40 bg-violet/10'
                      : 'border-line bg-surface-2/40 opacity-70',
                  )}
                >
                  <span
                    className={cn(
                      'mx-auto grid size-8 place-items-center rounded-lg',
                      unlocked ? 'bg-violet/15 text-violet' : 'bg-surface-3 text-ink-dim',
                    )}
                  >
                    {unlocked ? <Icon className="size-4" /> : <Lock className="size-3.5" />}
                  </span>
                  <div className="mt-2 text-[11.5px] font-semibold text-ink">{badge.name}</div>
                  <div className="mt-0.5 text-[10.5px] leading-snug text-ink-dim">
                    {badge.requirement}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[14px] font-semibold">Start over</h3>
            <p className="mt-1 text-[12.5px] text-ink-muted">
              Clears XP, badges, streaks and simulator history from this browser. Nothing is stored
              anywhere else.
            </p>
          </div>
          <Button
            variant="outline"
            icon={<RotateCcw className="size-4" />}
            onClick={() => setConfirmOpen(true)}
          >
            Reset progress
          </Button>
        </div>
      </Card>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Reset all progress?" width="max-w-md">
        <p className="text-[13px] leading-relaxed text-ink-muted">
          This wipes your level, XP, badges and streak so the app looks brand new again. It cannot be
          undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
            Keep my progress
          </Button>
          <Button
            variant="bear"
            onClick={() => {
              resetProgress();
              setConfirmOpen(false);
              pushToast({ kind: 'info', title: 'Progress reset', detail: 'Back to a clean slate.' });
            }}
          >
            Reset everything
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="tnum text-[17px] font-semibold text-ink">{value}</div>
      <div className="mt-0.5 text-[10.5px] uppercase tracking-wider text-ink-dim">{label}</div>
    </div>
  );
}
