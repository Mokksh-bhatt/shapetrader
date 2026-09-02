import { useMemo, useState } from 'react';
import { Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AnswerFeedback } from '@/components/feedback/AnswerFeedback';
import { InteractiveCandleChart } from '@/components/candle/InteractiveCandleChart';
import { CandleXray } from '@/components/candle/CandleXray';
import { SHAPE_BY_ID } from '@/data/candlestickShapes/shapes';
import { synthesizeShape, type ShapeSample } from '@/data/generator/shapeSynth';
import { createRng, hashSeed } from '@/data/generator/seededRng';
import { classify, getMetrics } from '@/engine/candles/candleClassifier';
import type { Candle, ShapeId } from '@/engine/candles/types';
import { useProgressStore } from '@/store/useProgressStore';

const CHART_LENGTH = 20; // lands the total (lead-in + shape) inside the ~18-24 target

/** Regenerates until the lead-in doesn't accidentally contain a second,
 *  uninjected instance of the target shape — the click has to be unambiguous. */
function buildSpotSample(shapeId: ShapeId, seed: number): ShapeSample {
  const leadIn = Math.max(CHART_LENGTH - SHAPE_BY_ID[shapeId].candleCount, 8);
  let sample: ShapeSample | null = null;
  for (let attempt = 0; attempt < 15; attempt += 1) {
    const rng = createRng(hashSeed(`spot-${shapeId}-${seed}-${attempt}`));
    const candidate = synthesizeShape(shapeId, rng, { leadIn });
    let dupes = 0;
    for (let i = 1; i < candidate.candles.length; i += 1) {
      if (i >= candidate.focusStart && i <= candidate.focusEnd) continue;
      const window = candidate.candles.slice(Math.max(0, i - 1), i + 1);
      if (classify(window) === shapeId) dupes += 1;
    }
    sample = candidate;
    if (dupes === 0) break;
  }
  // sample is always assigned above — the loop always runs at least once.
  return sample as ShapeSample;
}

function explainMiss(candles: Candle[], index: number, targetId: ShapeId): string {
  const target = SHAPE_BY_ID[targetId];
  const window = candles.slice(Math.max(0, index - 1), index + 1);
  const guess = classify(window);
  if (guess && guess !== targetId) {
    const guessDef = SHAPE_BY_ID[guess];
    return `That one's actually shaping up as a ${guessDef.name} — ${guessDef.tagline}`;
  }
  const c = candles[index];
  if (!c) return "That candle doesn't fit — try another.";
  const m = getMetrics(c);
  return `Body is ${Math.round(m.bodyRatio * 100)}% of its range, wicks ${Math.round(m.upperWickRatio * 100)}% / ${Math.round(m.lowerWickRatio * 100)}% — doesn't match: ${target.anatomy}`;
}

/**
 * Stage 2 — "Spot it". One real chart, one instance of the shape, and a
 * click. Wrong picks stay in play with an inline explanation rather than
 * ending the round, so guessing costs nothing but time.
 */
export function SpotStage({ shapeId, onDone }: { shapeId: ShapeId; onDone: () => void }) {
  const recordAnswer = useProgressStore((s) => s.recordAnswer);
  const markLessonRead = useProgressStore((s) => s.markLessonRead);
  const shape = SHAPE_BY_ID[shapeId];

  const [seed, setSeed] = useState(0);
  const sample = useMemo(() => buildSpotSample(shapeId, seed), [shapeId, seed]);
  const correctIndex = sample.focusEnd;

  const [selected, setSelected] = useState<number | null>(null);
  const [wrong, setWrong] = useState<number[]>([]);
  const [missReason, setMissReason] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);

  const handleSelect = (i: number) => {
    if (solved) return;
    if (i === correctIndex) {
      setSelected(i);
      setSolved(true);
      setMissReason(null);
      recordAnswer({
        moduleId: 'candlesticks',
        correct: true,
        questionLabel: 'Spot the shape on the chart',
        answerLabel: shape.name,
        shapeId,
      });
      markLessonRead('candlesticks', `${shapeId}-spot`);
    } else {
      setWrong((w) => (w.includes(i) ? w : [...w, i]));
      setMissReason(explainMiss(sample.candles, i, shapeId));
    }
  };

  const reshuffle = () => {
    setSeed((s) => s + 1);
    setSelected(null);
    setWrong([]);
    setMissReason(null);
    setSolved(false);
  };

  const revealMetrics = solved ? getMetrics(sample.candles[correctIndex]) : null;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">Spot it</p>
            <h3 className="mt-1 text-[16px] font-semibold tracking-tight">Find the {shape.name}</h3>
            <p className="mt-1 max-w-md text-[13px] leading-relaxed text-ink-muted">
              Exactly one candle in this chart is a {shape.name}. Click it.
            </p>
          </div>
          <Button variant="ghost" size="sm" icon={<Shuffle className="size-4" />} onClick={reshuffle}>
            New chart
          </Button>
        </div>

        <div className="mt-4">
          <InteractiveCandleChart
            candles={sample.candles}
            selectedIndex={selected}
            correctIndex={solved ? correctIndex : null}
            wrongIndices={wrong}
            onSelect={handleSelect}
            disabled={solved}
          />
        </div>

        {missReason && !solved ? (
          <p className="mt-3 rounded-lg border border-gold/30 bg-gold/8 p-3 text-[12.5px] leading-relaxed text-ink-muted">
            {missReason}
          </p>
        ) : null}
      </Card>

      {solved && revealMetrics ? (
        <AnswerFeedback
          correct
          title={shape.name}
          explanation={<p>{shape.psychology}</p>}
          extra={<CandleXray metrics={revealMetrics} />}
          onNext={onDone}
          nextLabel="Continue to Call it"
        />
      ) : null}
    </div>
  );
}
