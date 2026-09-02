import { CheckCircle2, RotateCcw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { RunSummary } from '@/engine/trading/portfolio';
import { formatMoney, formatSignedMoney } from '@/lib/formatters';

function feedbackLines(summary: RunSummary): { text: string; good: boolean }[] {
  const lines: { text: string; good: boolean }[] = [];

  if (summary.trades === 0) {
    lines.push({ text: 'No trades taken this run — sometimes the right call, but you didn’t get reps in.', good: false });
    return lines;
  }

  lines.push({
    text: `${summary.trades} trade${summary.trades === 1 ? '' : 's'} closed, ${summary.wins} winner${summary.wins === 1 ? '' : 's'} (${Math.round(summary.winRatePct * 100)}% win rate).`,
    good: true,
  });

  if (summary.noStopTrades > 0) {
    lines.push({
      text: `You traded without a stop on ${summary.noStopTrades} of ${summary.trades} trades — a single bad move on those had no floor.`,
      good: false,
    });
  } else {
    lines.push({ text: 'Every trade had a stop loss set. That habit matters more than any single win.', good: true });
  }

  if (summary.maxDrawdownPct > 0.15) {
    lines.push({
      text: `Equity dipped ${(summary.maxDrawdownPct * 100).toFixed(0)}% from its peak at one point — worth asking if position size was too large.`,
      good: false,
    });
  }

  return lines;
}

export function RunSummaryModal({
  open,
  onClose,
  summary,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  summary: RunSummary;
  onReset: () => void;
}) {
  const up = summary.netPnl >= 0;
  const lines = feedbackLines(summary);

  return (
    <Modal open={open} onClose={onClose} title="Session complete" width="max-w-md">
      <p className="text-[13px] text-ink-muted">The dataset has run out of candles. Here's how the session went.</p>

      <div className="mt-4 rounded-lg border border-line bg-surface-2 p-4 text-center">
        <div className={`tnum text-2xl font-bold ${up ? 'text-bull' : 'text-bear'}`}>{formatSignedMoney(summary.netPnl)}</div>
        <div className="tnum mt-1 text-[12px] text-ink-dim">
          {formatMoney(summary.startingCash)} → {formatMoney(summary.finalEquity)}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {lines.map((line, i) => (
          <div key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-muted">
            {line.good ? (
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-bull" />
            ) : (
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-gold" />
            )}
            <span>{line.text}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex gap-2">
        <Button variant="outline" full onClick={onClose}>
          Review the board
        </Button>
        <Button variant="primary" full icon={<RotateCcw className="size-4" />} onClick={onReset}>
          Trade again
        </Button>
      </div>
    </Modal>
  );
}
