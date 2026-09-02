import { Wallet } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { equityOf, maxDrawdownPct, realizedPnl, unrealizedPnl, winRate } from '@/engine/trading/portfolio';
import type { PortfolioState } from '@/engine/trading/types';
import { formatMoney, formatSignedMoney } from '@/lib/formatters';
import { cn } from '@/lib/cn';

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'bull' | 'bear' | 'neutral' }) {
  return (
    <div>
      <div
        className={cn(
          'tnum text-[15px] font-semibold',
          tone === 'bull' ? 'text-bull' : tone === 'bear' ? 'text-bear' : 'text-ink',
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[10.5px] uppercase tracking-wider text-ink-dim">{label}</div>
    </div>
  );
}

export function PnLSummary({ portfolio, markPrice }: { portfolio: PortfolioState; markPrice: number }) {
  const equity = equityOf(portfolio, markPrice);
  const realized = realizedPnl(portfolio.closedTrades);
  const unrealized = unrealizedPnl(portfolio.position, markPrice);
  const wr = winRate(portfolio.closedTrades);
  const dd = maxDrawdownPct(portfolio.equityCurve);

  return (
    <Card>
      <CardHeader title="Account" subtitle="Starting cash $10,000 · paper money only" icon={<Wallet className="size-4" />} />
      <div className="grid grid-cols-2 gap-y-4 sm:grid-cols-3">
        <Stat label="Cash" value={formatMoney(portfolio.cash)} />
        <Stat label="Equity" value={formatMoney(equity)} />
        <Stat
          label="Total P&L"
          value={formatSignedMoney(equity - portfolio.startingCash)}
          tone={equity >= portfolio.startingCash ? 'bull' : 'bear'}
        />
        <Stat label="Realized P&L" value={formatSignedMoney(realized)} tone={realized > 0 ? 'bull' : realized < 0 ? 'bear' : 'neutral'} />
        <Stat
          label="Unrealized P&L"
          value={formatSignedMoney(unrealized)}
          tone={unrealized > 0 ? 'bull' : unrealized < 0 ? 'bear' : 'neutral'}
        />
        <Stat label="Trades closed" value={String(portfolio.closedTrades.length)} />
        <Stat label="Win rate" value={portfolio.closedTrades.length > 0 ? `${Math.round(wr * 100)}%` : '—'} />
        <Stat label="Max drawdown" value={dd > 0 ? `−${(dd * 100).toFixed(1)}%` : '0.0%'} tone={dd > 0 ? 'bear' : 'neutral'} />
      </div>
    </Card>
  );
}
