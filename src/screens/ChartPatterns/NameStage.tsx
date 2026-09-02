import { useState } from 'react';
import { Tag } from 'lucide-react';
import type { PatternSample } from '@/data/generator/patternInjector';
import type { QuizPatternId } from '@/data/chartPatterns/patterns';
import { HuntChart } from '@/components/hunt/HuntChart';
import { ChoiceGrid, type Choice } from '@/components/feedback/ChoiceGrid';
import { AnswerFeedback } from '@/components/feedback/AnswerFeedback';
import { Card, Pill } from '@/components/ui/Card';
import { contentFor, labelFor } from './huntEngine';

/**
 * Stage 2 — NAME IT. The landmark is already found; now put a name on the
 * whole shape. Submitting reveals the pattern's annotation geometry on the
 * same chart, plus the authored anatomy/psychology/trading note.
 */
export function NameStage({
  sample,
  targetId,
  options,
  onResolved,
}: {
  sample: PatternSample;
  targetId: QuizPatternId;
  options: Choice[];
  onResolved: (correct: boolean, answerLabel: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const content = contentFor(targetId);
  const isCorrect = selected === targetId;

  const handleSelect = (id: string) => {
    if (answered) return;
    setSelected(id);
    setAnswered(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-brand">
          <Tag className="size-4" />
        </span>
        <div>
          <Pill tone="brand" className="mb-1.5">
            Name it
          </Pill>
          <p className="text-[14px] leading-snug text-ink">What is this shape?</p>
        </div>
      </div>

      <Card padded={false} className="overflow-hidden">
        <HuntChart
          candles={sample.candles}
          height={360}
          annotations={answered ? sample.annotations : []}
        />
      </Card>

      <Card>
        <ChoiceGrid
          options={options}
          selected={selected}
          correctId={answered ? targetId : null}
          answered={answered}
          onSelect={handleSelect}
          columns={2}
        />
      </Card>

      {answered ? (
        <AnswerFeedback
          correct={isCorrect}
          title={labelFor(targetId)}
          explanation={
            <>
              <p>{content.anatomy}</p>
              <p className="mt-2">{content.psychology}</p>
            </>
          }
          extra={<p className="italic text-ink-dim">{content.tradingNote}</p>}
          onNext={() => onResolved(isCorrect, selected ? labelFor(selected as QuizPatternId) : 'No answer')}
          nextLabel="What happens next"
        />
      ) : null}
    </div>
  );
}
