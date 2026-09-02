import { useMemo, useState } from 'react';
import { PriceChart } from '@/components/chart/PriceChart';
import { ChoiceGrid, type Choice } from '@/components/feedback/ChoiceGrid';
import { AnswerFeedback } from '@/components/feedback/AnswerFeedback';
import { Card } from '@/components/ui/Card';
import { SHAPE_BY_ID } from '@/data/candlestickShapes/shapes';
import { synthesizeShape } from '@/data/generator/shapeSynth';
import { hashSeed } from '@/data/generator/seededRng';
import type { Annotation } from '@/engine/annotations/types';
import type { ShapeId } from '@/engine/candles/types';
import { useProgressStore } from '@/store/useProgressStore';

type CallId = 'up' | 'down' | 'unclear';

const OPTIONS: Choice[] = [
  { id: 'up', label: 'More likely to turn up', hint: 'reversal or continuation to the upside' },
  { id: 'down', label: 'More likely to turn down', hint: 'reversal or continuation to the downside' },
  { id: 'unclear', label: 'Genuinely unclear', hint: 'the shape alone is not enough to call it' },
];

/** The honest mapping: bullish/bearish shapes have a directional lean, but a
 *  neutral one (doji, spinning top) genuinely doesn't — and "unclear" is the
 *  correct answer, not a cop-out. */
function correctCall(shapeId: ShapeId): CallId {
  const sentiment = SHAPE_BY_ID[shapeId].sentiment;
  return sentiment === 'bullish' ? 'up' : sentiment === 'bearish' ? 'down' : 'unclear';
}

/**
 * Stage 3 — "Call it". Shape recognition alone isn't trading; this asks what
 * the shape implies given its context, and lets a neutral shape's honest
 * answer be "wait for more information."
 */
export function CallStage({ shapeId, onDone }: { shapeId: ShapeId; onDone: () => void }) {
  const recordAnswer = useProgressStore((s) => s.recordAnswer);
  const markLessonRead = useProgressStore((s) => s.markLessonRead);
  const shape = SHAPE_BY_ID[shapeId];

  const sample = useMemo(() => synthesizeShape(shapeId, hashSeed(`call-${shapeId}`), { leadIn: 14 }), [shapeId]);
  const correctId = correctCall(shapeId);

  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const annotations: Annotation[] = [
    {
      id: 'focus',
      kind: 'span',
      points: [
        { index: sample.focusStart, price: 0 },
        { index: sample.focusEnd, price: 0 },
      ],
      tone: 'gold',
      label: shape.name,
    },
  ];

  const handleSelect = (id: string) => {
    if (answered) return;
    const correct = id === correctId;
    setSelected(id);
    setAnswered(true);
    recordAnswer({
      moduleId: 'candlesticks',
      correct,
      questionLabel: `What does a ${shape.name} suggest here?`,
      answerLabel: OPTIONS.find((o) => o.id === id)?.label ?? id,
      shapeId,
    });
  };

  const handleFinish = () => {
    markLessonRead('candlesticks', `${shapeId}-call`);
    onDone();
  };

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">Call it</p>
        <h3 className="mt-1 text-[16px] font-semibold tracking-tight">
          You've built it and spotted it — what does it mean?
        </h3>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
          This {shape.name.toLowerCase()} shows up {shape.context === 'anywhere' ? 'here' : shape.context}.
          Given that, what does it suggest about what happens next?
        </p>

        <div className="mt-4">
          <PriceChart candles={sample.candles} annotations={annotations} height={280} legendLabel="CALL IT · daily" />
        </div>

        <div className="mt-4">
          <ChoiceGrid
            options={OPTIONS}
            selected={selected}
            correctId={correctId}
            answered={answered}
            onSelect={handleSelect}
            columns={3}
          />
        </div>
      </Card>

      {answered ? (
        <AnswerFeedback
          correct={selected === correctId}
          title={shape.name}
          explanation={
            <>
              <p>{shape.psychology}</p>
              <p className="mt-2">
                <span className="text-ink">Context: </span>
                {shape.context === 'anywhere'
                  ? 'this one carries the same message wherever it appears.'
                  : `it only carries this meaning ${shape.context}.`}{' '}
                {shape.tradingNote}
              </p>
              {correctId === 'unclear' && selected !== 'unclear' ? (
                <p className="mt-2 text-gold">
                  It's tempting to call a direction here, but the honest read is "unclear" — a shape
                  this balanced is a hint to wait for the next candle, not a signal to act on by
                  itself.
                </p>
              ) : null}
            </>
          }
          onNext={handleFinish}
          nextLabel="Finish mission"
        />
      ) : null}
    </div>
  );
}
