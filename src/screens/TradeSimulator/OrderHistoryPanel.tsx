import { Clock, History, X } from 'lucide-react';
import { Card, CardHeader, Pill } from '@/components/ui/Card';
import type { Order } from '@/engine/trading/types';
import { formatPrice } from '@/lib/formatters';
import { cn } from '@/lib/cn';

function orderLabel(order: Order): string {
  const type = order.type === 'market' ? 'Market' : `Limit @ ${formatPrice(order.limitPrice ?? 0)}`;
  return `${order.side === 'buy' ? 'Buy' : 'Sell'} ${order.qty} · ${type}`;
}

export function OrderHistoryPanel({
  restingOrders,
  orderHistory,
  onCancel,
}: {
  restingOrders: Order[];
  orderHistory: Order[];
  onCancel: (orderId: string) => void;
}) {
  const history = [...orderHistory].reverse();

  return (
    <Card>
      <CardHeader title="Orders" icon={<History className="size-4" />} />

      <div className="space-y-2">
        <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-dim">
          Resting {restingOrders.length > 0 ? `(${restingOrders.length})` : ''}
        </div>
        {restingOrders.length === 0 ? (
          <p className="text-[12px] text-ink-dim">Nothing resting right now.</p>
        ) : (
          restingOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-gold/30 bg-gold/[0.06] px-3 py-2"
            >
              <div className="min-w-0">
                <div className="text-[12.5px] font-medium text-ink">{orderLabel(order)}</div>
                <div className="mt-0.5 flex items-center gap-1 text-[10.5px] text-ink-dim">
                  <Clock className="size-3" />
                  {order.type === 'limit' ? 'Resting — may never fill' : 'Fills at next open'}
                </div>
              </div>
              <button
                onClick={() => onCancel(order.id)}
                className="shrink-0 rounded-md p-1.5 text-ink-muted transition hover:bg-surface-3 hover:text-bear"
                aria-label="Cancel order"
                title="Cancel order"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 space-y-1.5 border-t border-line pt-3">
        <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-dim">History</div>
        {history.length === 0 ? (
          <p className="text-[12px] text-ink-dim">No orders yet.</p>
        ) : (
          <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
            {history.map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-ink">{orderLabel(order)}</div>
                  <div className="mt-0.5 truncate text-[10.5px] text-ink-dim">{order.note}</div>
                </div>
                <Pill
                  tone={order.status !== 'filled' ? 'neutral' : order.side === 'buy' ? 'bull' : 'bear'}
                  className={cn('shrink-0', order.status === 'cancelled' && 'opacity-70')}
                >
                  {order.status === 'filled' ? formatPrice(order.filledPrice ?? 0) : 'Cancelled'}
                </Pill>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
