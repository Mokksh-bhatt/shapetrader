import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Shuffle, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import {
  NO_PATTERN_ID,
  NO_PATTERN_INFO,
  PATTERN_BY_ID,
  PATTERN_IDS,
  type PatternId,
  type QuizPatternId,
} from '@/data/chartPatterns/patterns';
import { synthesizeNoPattern, synthesizePattern } from '@/data/generator/patternInjector';
import { hashSeed } from '@/data/generator/seededRng';
import { PriceChart } from '@/components/chart/PriceChart';
import { MiniCandles } from '@/components/chart/MiniCandles';
import { Card, CardHeader, Pill } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { Sentiment } from '@/engine/candles/types';

const SENTIMENT_ICON: Record<Sentiment, typeof TrendingUp> = {
  bullish: TrendingUp,
  bearish: TrendingDown,
  neutral: Minus,
};

const FAMILY_LABEL = {
  reversal: 'Reversal',
  continuation: 'Continuation',
  level: 'Level',
} as const;

/** Every gallery entry (the 8 real patterns, plus the honest "nothing here"
 *  case) rendered with a stable thumbnail so the list itself is a first look
 *  at what each shape is meant to look like. */
const GALLERY_ENTRIES = [
  ...PATTERN_IDS.map((id) => ({
    id: id as QuizPatternId,
    name: PATTERN_BY_ID[id].name,
    sentiment: PATTERN_BY_ID[id].sentiment,
  })),
  { id: NO_PATTERN_ID as QuizPatternId, name: NO_PATTERN_INFO.name, sentiment: 'neutral' as Sentiment },
];

function sampleFor(id: QuizPatternId, seed: number) {
  return id === NO_PATTERN_ID ? synthesizeNoPattern(seed) : synthesizePattern(id, seed);
}

export function PatternGallery() {
  const [selected, setSelected] = useState<QuizPatternId>(PATTERN_IDS[0]);
  const [variant, setVariant] = useState(0);
  const [showAnnotations, setShowAnnotations] = useState(false);

  // A fresh pattern deserves a fresh chance to test yourself before it's revealed.
  useEffect(() => {
    setVariant(0);
    setShowAnnotations(false);
  }, [selected]);

  const thumbnails = useMemo(
    () => GALLERY_ENTRIES.map((entry) => ({ ...entry, sample: sampleFor(entry.id, hashSeed(`${entry.id}:thumb`)) })),
    [],
  );

  const sample = useMemo(
    () => sampleFor(selected, hashSeed(`${selected}:learn:${variant}`)),
    [selected, variant],
  );

  const def = selected === NO_PATTERN_ID ? null : PATTERN_BY_ID[selected as PatternId];
  const content = def ?? NO_PATTERN_INFO;
  const SentimentIcon = SENTIMENT_ICON[def?.sentiment ?? 'neutral'];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
      <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {thumbnails.map((entry) => {
          const active = entry.id === selected;
          const Icon = SENTIMENT_ICON[entry.sentiment];
          return (
            <button
              key={entry.id}
              onClick={() => setSelected(entry.id)}
              className={cn(
                'w-[220px] shrink-0 rounded-[var(--radius-card)] border p-3 text-left transition lg:w-auto',
                active ? 'border-brand/60 bg-brand/8' : 'border-line bg-surface hover:border-line-strong',
              )}
            >
              <MiniCandles
                candles={entry.sample.candles}
                width={260}
                height={56}
                highlightFrom={entry.sample.focusStart}
                className="w-full"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className={cn('truncate text-[12.5px] font-medium', active ? 'text-brand' : 'text-ink')}>
                  {entry.name}
                </span>
                <Icon
                  className={cn(
                    'size-3.5 shrink-0',
                    entry.sentiment === 'bullish' ? 'text-bull' : entry.sentiment === 'bearish' ? 'text-bear' : 'text-ink-dim',
                  )}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="min-w-0 space-y-4">
        <Card>
          <CardHeader
            icon={<SentimentIcon className="size-4" />}
            title={content.name}
            subtitle={content.tagline}
            action={
              <div className="flex items-center gap-2">
                {def ? (
                  <>
                    <Pill tone={def.sentiment === 'bullish' ? 'bull' : def.sentiment === 'bearish' ? 'bear' : 'neutral'}>
                      {def.sentiment}
                    </Pill>
                    <Pill tone="brand">{FAMILY_LABEL[def.family]}</Pill>
                  </>
                ) : (
                  <Pill tone="gold">honest default</Pill>
                )}
              </div>
            }
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={showAnnotations ? 'primary' : 'outline'}
              size="sm"
              icon={showAnnotations ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              onClick={() => setShowAnnotations((v) => !v)}
            >
              {showAnnotations ? 'Hide annotations' : 'Show annotations'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Shuffle className="size-3.5" />}
              onClick={() => setVariant((v) => v + 1)}
            >
              New example
            </Button>
            {!showAnnotations ? (
              <span className="text-[11.5px] text-ink-dim">Try to spot it yourself before revealing the marks.</span>
            ) : null}
          </div>

          <PriceChart
            candles={sample.candles}
            annotations={showAnnotations ? sample.annotations : []}
            height={360}
            fitContent
            legendLabel={content.name}
            className="mt-3"
          />
        </Card>

        <Card className="space-y-4">
          <TeachingBlock title="Anatomy — what to look for" text={content.anatomy} />
          <TeachingBlock title="Psychology — why it happens" text={content.psychology} />
          <TeachingBlock title="Trading it — and the catch" text={content.tradingNote} />

          {def && def.confusableWith.length > 0 ? (
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-dim">
                Easy to confuse with
              </h4>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {def.confusableWith.map((id) => (
                  <button
                    key={id}
                    onClick={() => setSelected(id)}
                    className="rounded-full border border-line-strong bg-surface-2 px-2.5 py-1 text-[11.5px] text-ink-muted transition hover:border-brand/50 hover:text-ink"
                  >
                    {PATTERN_BY_ID[id].name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

function TeachingBlock({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-dim">{title}</h4>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{text}</p>
    </div>
  );
}
