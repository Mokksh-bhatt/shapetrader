import { Pause, Play, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { SPEED_OPTIONS, type PlaybackSpeed } from '@/store/usePortfolioStore';

export function PlaybackControls({
  isPlaying,
  speed,
  candleIndex,
  totalCandles,
  disabled,
  onPlay,
  onPause,
  onStep,
  onSetSpeed,
}: {
  isPlaying: boolean;
  speed: PlaybackSpeed;
  candleIndex: number;
  totalCandles: number;
  disabled: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onSetSpeed: (speed: PlaybackSpeed) => void;
}) {
  const atEnd = candleIndex >= totalCandles - 1;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5">
        {isPlaying ? (
          <Button size="sm" variant="subtle" icon={<Pause className="size-3.5" />} onClick={onPause} disabled={disabled}>
            Pause
          </Button>
        ) : (
          <Button size="sm" variant="primary" icon={<Play className="size-3.5" />} onClick={onPlay} disabled={disabled || atEnd}>
            Play
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          icon={<SkipForward className="size-3.5" />}
          onClick={onStep}
          disabled={disabled || isPlaying || atEnd}
          title={isPlaying ? 'Pause to step candle-by-candle' : 'Reveal one more candle'}
        >
          Step
        </Button>
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-line bg-surface-2 p-0.5">
        {SPEED_OPTIONS.map((option) => (
          <button
            key={option}
            onClick={() => onSetSpeed(option)}
            disabled={disabled}
            className={cn(
              'rounded-md px-2 py-1 text-[11px] font-medium tabular-nums transition',
              option === speed ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink disabled:hover:text-ink-muted',
            )}
          >
            {option}×
          </button>
        ))}
      </div>

      <span className="tnum text-[11px] text-ink-dim">
        Candle {Math.max(candleIndex + 1, 0)} / {totalCandles}
      </span>
    </div>
  );
}
