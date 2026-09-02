import { useEffect, useState } from 'react';
import { Info, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { computePositionSize } from '@/engine/trading/orderEngine';
import { equityOf, validateOrderRequest } from '@/engine/trading/portfolio';
import type { OrderRequest, PortfolioState } from '@/engine/trading/types';
import { clamp, formatMoney, formatPrice } from '@/lib/formatters';
import { cn } from '@/lib/cn';
import { CoachNote } from './CoachNote';

type SizeMode = 'shares' | 'dollars';

function parseNum(raw: string): number | undefined {
  if (raw.trim() === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export function OrderTicket({
  portfolio,
  lastClose,
  disabled,
  onSubmit,
}: {
  portfolio: PortfolioState;
  lastClose: number;
  disabled: boolean;
  onSubmit: (request: OrderRequest) => { ok: true } | { ok: false; reason: string };
}) {
  const hasPosition = portfolio.position !== null;

  const [side, setSide] = useState<'buy' | 'sell'>(hasPosition ? 'sell' : 'buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [sizeMode, setSizeMode] = useState<SizeMode>('shares');
  const [sizeStr, setSizeStr] = useState('');
  const [limitStr, setLimitStr] = useState('');
  const [stopStr, setStopStr] = useState('');
  const [targetStr, setTargetStr] = useState('');
  const [riskPct, setRiskPct] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // The side you're even allowed to place flips with the position — stay in
  // sync rather than let the trader submit a buy while already holding, or a
  // sell while flat.
  useEffect(() => {
    setSide(hasPosition ? 'sell' : 'buy');
  }, [hasPosition]);

  const equity = equityOf(portfolio, lastClose);
  const limitPrice = parseNum(limitStr);
  const entryRef = orderType === 'limit' && limitPrice !== undefined ? limitPrice : lastClose;

  const dollarSize = parseNum(sizeStr);
  const qty =
    sizeMode === 'shares'
      ? Math.max(0, Math.floor(dollarSize ?? 0))
      : entryRef > 0
        ? Math.max(0, Math.floor((dollarSize ?? 0) / entryRef))
        : 0;

  const stopLoss = side === 'buy' ? parseNum(stopStr) : undefined;
  const takeProfit = side === 'buy' ? parseNum(targetStr) : undefined;

  const sizing =
    side === 'buy' && stopLoss !== undefined
      ? computePositionSize({ equity, entryPrice: entryRef, stopPrice: stopLoss, takeProfitPrice: takeProfit, riskPct: riskPct / 100 })
      : null;

  const request: OrderRequest = {
    side,
    type: orderType,
    qty,
    limitPrice: orderType === 'limit' ? limitPrice : undefined,
    stopLoss,
    takeProfit,
  };

  const validation = validateOrderRequest(portfolio, request, lastClose);
  const dollarRisk = side === 'buy' && stopLoss !== undefined ? qty * (entryRef - stopLoss) : null;
  const riskPctOfEquity = dollarRisk !== null && equity > 0 ? dollarRisk / equity : null;

  function reset() {
    setSizeStr('');
    setLimitStr('');
    setStopStr('');
    setTargetStr('');
  }

  function submit() {
    setSubmitError(null);
    const result = onSubmit(request);
    if (result.ok) reset();
    else setSubmitError(result.reason);
  }

  const canSubmit = !disabled && qty > 0 && validation.ok;

  return (
    <Card>
      <CardHeader title="Order ticket" icon={<Info className="size-4" />} />

      <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-surface-2 p-1">
        <button
          onClick={() => setSide('buy')}
          disabled={hasPosition}
          className={cn(
            'rounded-md py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-35',
            side === 'buy' ? 'bg-bull/15 text-bull ring-1 ring-bull/40' : 'text-ink-muted hover:text-ink',
          )}
        >
          Buy
        </button>
        <button
          onClick={() => setSide('sell')}
          disabled={!hasPosition}
          className={cn(
            'rounded-md py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-35',
            side === 'sell' ? 'bg-bear/15 text-bear ring-1 ring-bear/40' : 'text-ink-muted hover:text-ink',
          )}
        >
          Sell
        </button>
      </div>

      <div className="mt-3 flex gap-1.5 text-[12px]">
        {(['market', 'limit'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setOrderType(t)}
            className={cn(
              'flex-1 rounded-md border py-1.5 font-medium capitalize transition',
              orderType === t ? 'border-brand/50 bg-brand/10 text-brand' : 'border-line text-ink-muted hover:text-ink',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {orderType === 'limit' ? (
        <div className="mt-3">
          <label className="text-[11px] text-ink-dim">Limit price</label>
          <input
            value={limitStr}
            onChange={(e) => setLimitStr(e.target.value)}
            inputMode="decimal"
            placeholder={formatPrice(lastClose)}
            className="tnum mt-1 h-9 w-full rounded-md border border-line bg-surface-2 px-2.5 text-[13px] text-ink outline-none focus:border-brand/50"
          />
        </div>
      ) : null}

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between">
          <label className="text-[11px] text-ink-dim">Quantity</label>
          <div className="flex gap-0.5 rounded-md bg-surface-2 p-0.5 text-[10px]">
            {(['shares', 'dollars'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSizeMode(mode)}
                className={cn(
                  'rounded px-1.5 py-0.5 font-medium',
                  sizeMode === mode ? 'bg-surface-3 text-ink' : 'text-ink-dim',
                )}
              >
                {mode === 'shares' ? 'Shares' : '$'}
              </button>
            ))}
          </div>
        </div>
        <input
          value={sizeStr}
          onChange={(e) => setSizeStr(e.target.value)}
          inputMode="decimal"
          placeholder={sizeMode === 'shares' ? 'e.g. 10' : 'e.g. 1000'}
          className="tnum h-9 w-full rounded-md border border-line bg-surface-2 px-2.5 text-[13px] text-ink outline-none focus:border-brand/50"
        />
        {sizeMode === 'dollars' && qty > 0 ? (
          <div className="tnum mt-1 text-[11px] text-ink-dim">≈ {qty} shares at {formatPrice(entryRef)}</div>
        ) : null}
      </div>

      {side === 'buy' ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-ink-dim">Stop loss</label>
            <input
              value={stopStr}
              onChange={(e) => setStopStr(e.target.value)}
              inputMode="decimal"
              placeholder="optional"
              className="tnum mt-1 h-9 w-full rounded-md border border-line bg-surface-2 px-2.5 text-[13px] text-ink outline-none focus:border-bear/50"
            />
          </div>
          <div>
            <label className="text-[11px] text-ink-dim">Take profit</label>
            <input
              value={targetStr}
              onChange={(e) => setTargetStr(e.target.value)}
              inputMode="decimal"
              placeholder="optional"
              className="tnum mt-1 h-9 w-full rounded-md border border-line bg-surface-2 px-2.5 text-[13px] text-ink outline-none focus:border-bull/50"
            />
          </div>
        </div>
      ) : null}

      {side === 'buy' && stopStr.trim() !== '' ? (
        <div className="mt-3 rounded-lg border border-line bg-surface-2 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-ink-dim">Risk this trade</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0.1}
                max={10}
                step={0.1}
                value={riskPct}
                onChange={(e) => setRiskPct(clamp(Number(e.target.value) || 0, 0.1, 10))}
                className="tnum h-6 w-14 rounded border border-line bg-surface px-1.5 text-[11px] text-ink outline-none"
              />
              <span className="text-[11px] text-ink-dim">% of equity</span>
            </div>
          </div>

          {sizing?.valid ? (
            <button
              onClick={() => setSizeStr(String(sizing.qty))}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-brand/40 bg-brand/10 py-1.5 text-[11.5px] font-medium text-brand transition hover:bg-brand/15"
            >
              <Sparkles className="size-3" />
              Use suggested size — {sizing.qty} shares ({formatMoney(sizing.dollarRisk)} risk)
            </button>
          ) : sizing && !sizing.valid ? (
            <p className="mt-2 text-[11px] text-bear">{sizing.reason}</p>
          ) : null}
        </div>
      ) : null}

      {dollarRisk !== null && dollarRisk > 0 ? (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-bear/[0.08] px-3 py-2 text-[12px]">
          <span className="text-ink-muted">You are risking</span>
          <span className="tnum font-semibold text-bear">
            {formatMoney(dollarRisk)}
            {riskPctOfEquity !== null ? ` (${(riskPctOfEquity * 100).toFixed(1)}% of equity)` : ''}
          </span>
        </div>
      ) : null}

      {sizing?.riskRewardRatio !== null && sizing?.riskRewardRatio !== undefined && side === 'buy' && targetStr.trim() !== '' ? (
        <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-ink-dim">
          <span>Reward : risk</span>
          <span className="tnum font-medium text-ink">{sizing.riskRewardRatio.toFixed(2)} R</span>
        </div>
      ) : null}

      <div className="mt-3 rounded-lg border border-line bg-surface-2 px-3 py-2 text-[11.5px] leading-relaxed text-ink-muted">
        {qty <= 0
          ? 'Enter a quantity to see what this order will do.'
          : orderType === 'market'
            ? `${side === 'buy' ? 'Buy' : 'Sell'} ${qty} share${qty === 1 ? '' : 's'} at the market. Fills at the next candle's open — not the price shown now.`
            : `${side === 'buy' ? 'Buy' : 'Sell'} ${qty} share${qty === 1 ? '' : 's'} if price ${side === 'buy' ? 'falls to' : 'rises to'} ${limitPrice ?? '—'}. This may never fill.`}
      </div>

      {!validation.ok && qty > 0 ? <p className="mt-2 text-[11.5px] text-bear">{validation.reason}</p> : null}
      {submitError ? <p className="mt-2 text-[11.5px] text-bear">{submitError}</p> : null}

      <Button
        className="mt-3"
        full
        variant={side === 'buy' ? 'bull' : 'bear'}
        disabled={!canSubmit}
        onClick={submit}
      >
        {side === 'buy' ? 'Place buy order' : 'Place sell order'}
      </Button>

      <CoachNote className="mt-3">
        {orderType === 'market'
          ? 'A market order always fills, but you don’t control the price — you accept the next open, gap and all.'
          : 'A limit order controls price, not certainty — set it too far from the market and it may sit unfilled all session.'}
      </CoachNote>
    </Card>
  );
}
