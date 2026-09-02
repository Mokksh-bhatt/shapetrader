import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CandleForge, type ForgeCandleValue } from '@/components/candle/CandleForge';
import { CandleXray } from '@/components/candle/CandleXray';
import { classify, getMetrics } from '@/engine/candles/candleClassifier';
import type { Candle, ShapeId } from '@/engine/candles/types';
import { SHAPE_BY_ID } from '@/data/candlestickShapes/shapes';
import { FORGE_CONTEXT_START, FORGE_SOLUTION, FORGE_TARGET_START } from '../forgePresets';
import { forgeHint } from '../forgeHints';
import { useProgressStore } from '@/store/useProgressStore';

function aOrAn(name: string): string {
  return /^[AEIOU]/i.test(name) ? 'an' : 'a';
}

/**
 * Stage 1 — "Forge it". The learner drags a raw candle into shape against a
 * live goal, rather than being told the rule first. Completion is detected
 * the moment classify() — the same function the rest of the app trusts —
 * agrees the result is the target shape.
 */
export function ForgeStage({ shapeId, onDone }: { shapeId: ShapeId; onDone: () => void }) {
  const markLessonRead = useProgressStore((s) => s.markLessonRead);
  const shape = SHAPE_BY_ID[shapeId];
  const isPair = shape.candleCount === 2;
  const contextValue = FORGE_CONTEXT_START[shapeId];

  const [target, setTarget] = useState<ForgeCandleValue>(FORGE_TARGET_START[shapeId]);
  const [markedDone, setMarkedDone] = useState(false);

  const targetCandle: Candle = { time: '2024-01-02', ...target };
  const contextCandle: Candle | undefined = contextValue ? { time: '2024-01-01', ...contextValue } : undefined;
  const classifyInput = contextCandle ? [contextCandle, targetCandle] : [targetCandle];
  const solved = classify(classifyInput) === shapeId;
  const metrics = getMetrics(targetCandle);

  useEffect(() => {
    if (solved && !markedDone) {
      setMarkedDone(true);
      markLessonRead('candlesticks', `${shapeId}-forge`);
    }
  }, [solved, markedDone, shapeId, markLessonRead]);

  const handleChange = (next: ForgeCandleValue) => {
    if (isPair) {
      // Wicks don't affect engulfing classification — pad them automatically
      // so only open/close (the two handles shown) matter to the learner.
      const high = Math.max(next.open, next.close) + 2;
      const low = Math.min(next.open, next.close) - 2;
      setTarget({ ...next, high, low });
    } else {
      setTarget(next);
    }
  };

  const showMe = () => {
    const solution = FORGE_SOLUTION[shapeId];
    setTarget(solution.target);
  };

  const hint = solved ? null : forgeHint(shapeId, classifyInput);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">Forge it</p>
            <h3 className="mt-1 text-[16px] font-semibold tracking-tight">Build {aOrAn(shape.name)} {shape.name}</h3>
            <p className="mt-1 max-w-md text-[13px] leading-relaxed text-ink-muted">
              Drag the handles — or tab to one and use the arrow keys — until this candle actually
              qualifies.
            </p>
          </div>
          <Button variant="ghost" size="sm" icon={<Wand2 className="size-4" />} onClick={showMe}>
            Show me
          </Button>
        </div>

        <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,260px)] md:items-center">
          <div className="flex justify-center rounded-lg border border-line bg-base/40 p-3">
            <CandleForge
              value={target}
              onChange={handleChange}
              context={contextValue}
              handles={isPair ? ['open', 'close'] : ['open', 'high', 'low', 'close']}
            />
          </div>

          <div className="space-y-3">
            <CandleXray metrics={metrics} />
            <AnimatePresence mode="wait">
              {!solved ? (
                <motion.p
                  key={hint}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="rounded-lg border border-gold/30 bg-gold/8 p-3 text-[12.5px] leading-relaxed text-ink-muted"
                >
                  {hint}
                </motion.p>
              ) : (
                <motion.div
                  key="solved"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-lg border border-bull/40 bg-bull/10 p-3"
                >
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-bull">
                    <Sparkles className="size-3.5" /> That's a {shape.name}.
                  </p>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">{shape.psychology}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button disabled={!solved} onClick={onDone}>
          Continue to Spot it
        </Button>
      </div>
    </div>
  );
}
