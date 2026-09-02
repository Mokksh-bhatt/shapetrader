import { useState } from 'react';
import { Pencil, ShieldCheck, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, Pill } from '@/components/ui/Card';
import { unrealizedPnl } from '@/engine/trading/portfolio';
import type { Position } from '@/engine/trading/types';
import { formatMoney, formatPrice, formatSignedMoney } from '@/lib/formatters';
import { CoachNote } from './CoachNote';

export function PositionsPanel({
  position,
  markPrice,
  onUpdateRisk,
}: {
  position: Position | null;
  markPrice: number;
  onUpdateRisk: (input: { stopLoss?: number | null; takeProfit?: number | null }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [stopInput, setStopInput] = useState('');
  const [targetInput, setTargetInput] = useState('');

  if (!position) {
    return (
      <Card>
        <CardHeader title="Position" icon={<TrendingUp className="size-4" />} />
        <p className="text-[13px] text-ink-muted">No open position.</p>
        <CoachNote className="mt-3">
          You're flat — no risk on the table. That's a valid stance when the setup isn't there, not just the state
          between trades.
        </CoachNote>
      </Card>
    );
  }

  const pnl = unrealizedPnl(position, markPrice);
  const pnlPct = position.avgCost > 0 ? (markPrice - position.avgCost) / position.avgCost : 0;

  function startEdit() {
    setStopInput(position!.stopLoss !== undefined ? String(position!.stopLoss) : '');
    setTargetInput(position!.takeProfit !== undefined ? String(position!.takeProfit) : '');
    setEditing(true);
  }

  function save() {
    const stop = stopInput.trim() === '' ? null : Number(stopInput);
    const target = targetInput.trim() === '' ? null : Number(targetInput);
    onUpdateRisk({
      stopLoss: stop === null ? null : Number.isFinite(stop) ? stop : undefined,
      takeProfit: target === null ? null : Number.isFinite(target) ? target : undefined,
    });
    setEditing(false);
  }

  return (
    <Card>
      <CardHeader
        title="Position"
        icon={<TrendingUp className="size-4" />}
        action={<Pill tone="bull">LONG</Pill>}
      />

      <div className="grid grid-cols-2 gap-y-3 text-[13px] sm:grid-cols-3">
        <div>
          <div className="tnum font-semibold text-ink">{position.qty}</div>
          <div className="text-[10.5px] uppercase tracking-wider text-ink-dim">Shares</div>
        </div>
        <div>
          <div className="tnum font-semibold text-ink">{formatPrice(position.avgCost)}</div>
          <div className="text-[10.5px] uppercase tracking-wider text-ink-dim">Avg cost</div>
        </div>
        <div>
          <div className="tnum font-semibold text-ink">{formatMoney(position.qty * markPrice)}</div>
          <div className="text-[10.5px] uppercase tracking-wider text-ink-dim">Market value</div>
        </div>
        <div>
          <div className={`tnum font-semibold ${pnl > 0 ? 'text-bull' : pnl < 0 ? 'text-bear' : 'text-ink'}`}>
            {formatSignedMoney(pnl)}
          </div>
          <div className="text-[10.5px] uppercase tracking-wider text-ink-dim">Unrealized</div>
        </div>
        <div>
          <div className={`tnum font-semibold ${pnlPct > 0 ? 'text-bull' : pnlPct < 0 ? 'text-bear' : 'text-ink'}`}>
            {pnlPct >= 0 ? '+' : '−'}
            {Math.abs(pnlPct * 100).toFixed(1)}%
          </div>
          <div className="text-[10.5px] uppercase tracking-wider text-ink-dim">Return</div>
        </div>
      </div>

      <div className="mt-4 border-t border-line pt-3">
        {editing ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="w-16 shrink-0 text-[11px] text-ink-dim">Stop</label>
              <input
                value={stopInput}
                onChange={(e) => setStopInput(e.target.value)}
                inputMode="decimal"
                placeholder="none"
                className="tnum h-8 w-full rounded-md border border-line bg-surface-2 px-2 text-[13px] text-ink outline-none focus:border-brand/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-16 shrink-0 text-[11px] text-ink-dim">Target</label>
              <input
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                inputMode="decimal"
                placeholder="none"
                className="tnum h-8 w-full rounded-md border border-line bg-surface-2 px-2 text-[13px] text-ink outline-none focus:border-brand/50"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="primary" onClick={save} full>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)} full>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-[12px]">
              <span className="text-ink-muted">
                Stop{' '}
                <span className="tnum font-medium text-bear">
                  {position.stopLoss !== undefined ? formatPrice(position.stopLoss) : '— none'}
                </span>
              </span>
              <span className="text-ink-muted">
                Target{' '}
                <span className="tnum font-medium text-bull">
                  {position.takeProfit !== undefined ? formatPrice(position.takeProfit) : '— none'}
                </span>
              </span>
            </div>
            <button
              onClick={startEdit}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-ink-muted transition hover:bg-surface-2 hover:text-ink"
            >
              <Pencil className="size-3" /> Edit
            </button>
          </div>
        )}
      </div>

      {position.stopLoss === undefined ? (
        <CoachNote className="mt-3">
          No stop set — this position closes only when you decide to sell. That's how a small mistake turns into a
          large one.
        </CoachNote>
      ) : (
        <CoachNote className="mt-3">
          <ShieldCheck className="mb-0.5 inline size-3 text-bull" /> Stop is live: it's checked against every new
          candle's low, so it can close this position for you while you're not watching.
        </CoachNote>
      )}
    </Card>
  );
}
