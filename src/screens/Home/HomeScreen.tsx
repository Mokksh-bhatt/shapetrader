import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Crosshair, Flame, FlaskConical, Library, Sparkles, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { MiniCandles } from '@/components/chart/MiniCandles';
import { ModuleCard } from './ModuleCard';
import { generateRandomWalk } from '@/data/generator/randomWalk';
import { levelForXp } from '@/engine/progress/xp';
import { BADGES } from '@/engine/progress/badges';
import { nextModule, summarizeModules } from '@/engine/progress/summary';
import { useProgressStore } from '@/store/useProgressStore';

const ICONS = {
  candlesticks: FlaskConical,
  patterns: Crosshair,
  caseStudies: Library,
  simulator: Wallet,
} as const;

const STEPS = [
  {
    title: 'Build it',
    body: 'You do not read about a hammer — you drag one into existence and watch the app confirm it the moment the shape is right.',
  },
  {
    title: 'Hunt it',
    body: 'Then find that shape hiding in a chart full of noise, and see whether it actually paid off. Sometimes it will not. That is the lesson.',
  },
  {
    title: 'Trade it',
    body: 'Finally take the desk: pick a size, set the price that proves you wrong, and live with the result candle by candle.',
  },
];

export function HomeScreen() {
  const state = useProgressStore();
  const modules = summarizeModules(state);
  const next = nextModule(state);
  const level = levelForXp(state.xp);

  const badgesEarned = Object.keys(state.badges).length;
  const answered = Object.values(state.modules).reduce((sum, m) => sum + m.attempted, 0);
  const correct = Object.values(state.modules).reduce((sum, m) => sum + m.correct, 0);
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : null;
  const isNewcomer = answered === 0 && state.trading.closed === 0;

  // A fixed seed keeps the hero chart identical on every load — the page
  // should look the same in a demo as it did in rehearsal.
  const heroCandles = useMemo(() => generateRandomWalk(20240115, { count: 46, drift: 0.0016 }), []);

  return (
    <div className="animate-rise space-y-6">
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="relative overflow-hidden lg:col-span-2" padded={false}>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-25">
            <MiniCandles candles={heroCandles} width={760} height={150} className="w-full" />
          </div>
          <div className="relative p-6 sm:p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-[11px] font-medium text-brand">
              <Sparkles className="size-3" />
              Beginner friendly · no money involved
            </span>

            <h2 className="mt-4 max-w-lg text-2xl font-semibold leading-tight tracking-tight sm:text-[28px]">
              Learn to read the market one shape at a time.
            </h2>
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-ink-muted">
              Charts look like noise until you know the shapes. So you will not be reading about them —
              you will build them by hand, hunt them down in real charts, live through four true market
              stories, and then take a trading desk of your own. No money, no jargon walls, no lectures.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to={next.route}>
                <Button size="lg" icon={<ArrowRight className="size-4" />}>
                  {isNewcomer ? 'Start playing — Candle Lab' : `Continue — ${next.title}`}
                </Button>
              </Link>
              <Link to="/glossary">
                <Button size="lg" variant="outline">
                  Open the cheat sheet
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <ProgressRing value={level.progress} size={84} stroke={7}>
              <div className="text-center">
                <div className="tnum text-lg font-bold leading-none">{level.level}</div>
                <div className="text-[9px] uppercase tracking-widest text-ink-dim">level</div>
              </div>
            </ProgressRing>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-ink">{level.title}</div>
              <div className="tnum mt-0.5 text-[12px] text-ink-muted">{state.xp} XP earned</div>
              {level.xpToNext !== null ? (
                <div className="tnum mt-1 text-[11px] text-ink-dim">{level.xpToNext} XP to next rank</div>
              ) : null}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
            <div>
              <div className="tnum text-base font-semibold text-ink">{state.dayStreak.current}</div>
              <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-dim">
                <Flame className="size-3" /> streak
              </div>
            </div>
            <div>
              <div className="tnum text-base font-semibold text-ink">
                {badgesEarned}
                <span className="text-[11px] font-normal text-ink-dim">/{BADGES.length}</span>
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-dim">badges</div>
            </div>
            <div>
              <div className="tnum text-base font-semibold text-ink">
                {accuracy === null ? '—' : `${accuracy}%`}
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-dim">accuracy</div>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
            Your run
          </h2>
          <Link to="/progress" className="text-[12px] text-brand hover:underline">
            Trophy room
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {modules.map((m) => (
            <ModuleCard
              key={m.id}
              module={m}
              icon={ICONS[m.id]}
              recommended={m.id === next.id && !m.done}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
          How you learn here
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <Card key={step.title}>
              <div className="tnum text-[11px] font-semibold text-brand">0{i + 1}</div>
              <h3 className="mt-1.5 text-[14px] font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">{step.body}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
