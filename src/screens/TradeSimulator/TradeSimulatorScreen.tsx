import { useEffect, useMemo, useState } from 'react';
import { ListChecks, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PriceChart } from '@/components/chart/PriceChart';
import type { Annotation } from '@/engine/annotations/types';
import { summarizeRun } from '@/engine/trading/portfolio';
import { INITIAL_VISIBLE_CANDLES, usePortfolioStore } from '@/store/usePortfolioStore';
import { CoachNote } from './CoachNote';
import { DatasetPicker } from './DatasetPicker';
import { OrderHistoryPanel } from './OrderHistoryPanel';
import { OrderTicket } from './OrderTicket';
import { PlaybackControls } from './PlaybackControls';
import { PnLSummary } from './PnLSummary';
import { PositionsPanel } from './PositionsPanel';
import { RunSummaryModal } from './RunSummaryModal';
import { findDataset } from './datasets';

/** Base tick length at 1x — halves/doubles with the speed control. */
const TICK_MS = 850;

export function TradeSimulatorScreen() {
  const datasetId = usePortfolioStore((s) => s.datasetId);
  const candles = usePortfolioStore((s) => s.candles);
  const candleIndex = usePortfolioStore((s) => s.candleIndex);
  const isPlaying = usePortfolioStore((s) => s.isPlaying);
  const speed = usePortfolioStore((s) => s.speed);
  const sessionEnded = usePortfolioStore((s) => s.sessionEnded);
  const portfolio = usePortfolioStore((s) => s.portfolio);

  const hydrateCandles = usePortfolioStore((s) => s.hydrateCandles);
  const loadDataset = usePortfolioStore((s) => s.loadDataset);
  const resetSession = usePortfolioStore((s) => s.resetSession);
  const play = usePortfolioStore((s) => s.play);
  const pause = usePortfolioStore((s) => s.pause);
  const setSpeed = usePortfolioStore((s) => s.setSpeed);
  const submitOrder = usePortfolioStore((s) => s.submitOrder);
  const cancelOrder = usePortfolioStore((s) => s.cancelOrder);
  const updatePositionRisk = usePortfolioStore((s) => s.updatePositionRisk);

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [pendingDatasetId, setPendingDatasetId] = useState<string | null>(null);

  // A reload leaves datasetId in storage but the candle array empty (it's
  // deliberately never persisted). Datasets are seeded/deterministic, so
  // regenerating them here is cheap and keeps localStorage small.
  useEffect(() => {
    if (datasetId && candles.length === 0) {
      const dataset = findDataset(datasetId);
      if (dataset) hydrateCandles(datasetId, dataset.candles);
    }
  }, [datasetId, candles.length, hydrateCandles]);

  // The playback clock is owned by this component, not the store, so React
  // guarantees it's cleared on unmount. Keying the effect on datasetId as
  // well means a dataset switch (which forces isPlaying false) can never
  // leave a stale interval running against the old candle array.
  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      usePortfolioStore.getState().revealNext();
    }, TICK_MS / speed);
    return () => window.clearInterval(id);
  }, [isPlaying, speed, datasetId]);

  useEffect(() => {
    if (sessionEnded) setSummaryOpen(true);
  }, [sessionEnded]);

  const visibleCandles = useMemo(() => candles.slice(0, candleIndex + 1), [candles, candleIndex]);
  const lastCandle = visibleCandles[visibleCandles.length - 1];
  const lastClose = lastCandle?.close ?? 0;
  const dataset = findDataset(datasetId);

  const annotations = useMemo<Annotation[]>(() => {
    const marks: Annotation[] = [];
    const position = portfolio.position;

    if (position) {
      const span = [
        { index: position.openedAtIndex, price: position.avgCost },
        { index: candleIndex, price: position.avgCost },
      ];

      // Shaded zones carry no label of their own — a 'band' label always
      // sits at its top edge, and a risk zone and reward zone share the
      // entry price as one of their edges, so two labels would collide
      // right on the entry line. The lines below carry the labels instead.
      if (position.stopLoss !== undefined) {
        marks.push({
          id: 'risk-band',
          kind: 'band',
          points: [
            { index: 0, price: position.avgCost },
            { index: 0, price: position.stopLoss },
          ],
          tone: 'bear',
        });
        marks.push({
          id: 'stop-line',
          kind: 'line',
          points: [
            { index: position.openedAtIndex, price: position.stopLoss },
            { index: candleIndex, price: position.stopLoss },
          ],
          tone: 'bear',
          dashed: true,
          label: `Stop ${position.stopLoss.toFixed(2)}`,
        });
      }
      if (position.takeProfit !== undefined) {
        marks.push({
          id: 'reward-band',
          kind: 'band',
          points: [
            { index: 0, price: position.avgCost },
            { index: 0, price: position.takeProfit },
          ],
          tone: 'bull',
        });
        marks.push({
          id: 'target-line',
          kind: 'line',
          points: [
            { index: position.openedAtIndex, price: position.takeProfit },
            { index: candleIndex, price: position.takeProfit },
          ],
          tone: 'bull',
          dashed: true,
          label: `Target ${position.takeProfit.toFixed(2)}`,
        });
      }

      marks.push({
        id: 'entry-line',
        kind: 'line',
        points: span,
        tone: 'brand',
        label: `Entry ${position.avgCost.toFixed(2)}`,
      });
    }

    const restingBuy = portfolio.restingOrders.find((o) => o.side === 'buy' && o.type === 'limit');
    if (restingBuy?.limitPrice !== undefined) {
      marks.push({
        id: 'resting-limit',
        kind: 'line',
        points: [
          { index: Math.max(candleIndex - 15, 0), price: restingBuy.limitPrice },
          { index: candleIndex, price: restingBuy.limitPrice },
        ],
        tone: 'gold',
        dashed: true,
        label: `Limit buy ${restingBuy.limitPrice.toFixed(2)}`,
      });
    }

    return marks;
  }, [portfolio.position, portfolio.restingOrders, candleIndex]);

  const summary = useMemo(() => summarizeRun(portfolio, lastClose), [portfolio, lastClose]);

  const hasActivity =
    portfolio.position !== null ||
    portfolio.closedTrades.length > 0 ||
    portfolio.restingOrders.length > 0 ||
    candleIndex > Math.min(INITIAL_VISIBLE_CANDLES, candles.length) - 1;

  function handleSelectDataset(id: string) {
    if (id === datasetId) return;
    if (hasActivity) {
      setPendingDatasetId(id);
      return;
    }
    const next = findDataset(id);
    if (next) loadDataset(id, next.candles);
  }

  function confirmSwitch() {
    if (!pendingDatasetId) return;
    const next = findDataset(pendingDatasetId);
    if (next) loadDataset(pendingDatasetId, next.candles);
    setPendingDatasetId(null);
  }

  const tradingDeskReady = Boolean(dataset && lastCandle);

  return (
    <div className="animate-rise space-y-5">
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-dim">Scenario</h2>
          {datasetId ? (
            <Button size="sm" variant="ghost" icon={<RotateCcw className="size-3.5" />} onClick={resetSession}>
              Reset session
            </Button>
          ) : null}
        </div>
        <DatasetPicker selectedId={datasetId} onSelect={handleSelectDataset} />
      </section>

      {!tradingDeskReady ? (
        <CoachNote>Pick a scenario above to reveal its first candles and start trading.</CoachNote>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <PlaybackControls
              isPlaying={isPlaying}
              speed={speed}
              candleIndex={candleIndex}
              totalCandles={candles.length}
              disabled={sessionEnded}
              onPlay={play}
              onPause={pause}
              onStep={() => usePortfolioStore.getState().revealNext()}
              onSetSpeed={setSpeed}
            />

            <PriceChart
              candles={visibleCandles}
              height={420}
              annotations={annotations}
              fitContent={false}
              showVolume
              legendLabel={`${dataset!.label.toUpperCase()} · DAILY`}
            />

            <CoachNote>
              Candles reveal one at a time — you only ever see what would have been on the screen at that moment. No
              peeking at what comes next is what makes the practice honest.
            </CoachNote>

            {sessionEnded ? (
              <Button variant="outline" icon={<ListChecks className="size-4" />} onClick={() => setSummaryOpen(true)}>
                View session summary
              </Button>
            ) : null}
          </div>

          <div className="space-y-4">
            <OrderTicket
              portfolio={portfolio}
              lastClose={lastClose}
              disabled={!lastCandle || sessionEnded}
              onSubmit={submitOrder}
            />
            <PositionsPanel position={portfolio.position} markPrice={lastClose} onUpdateRisk={updatePositionRisk} />
            <PnLSummary portfolio={portfolio} markPrice={lastClose} />
            <OrderHistoryPanel
              restingOrders={portfolio.restingOrders}
              orderHistory={portfolio.orderHistory}
              onCancel={cancelOrder}
            />
          </div>
        </div>
      )}

      <RunSummaryModal
        open={summaryOpen && sessionEnded}
        onClose={() => setSummaryOpen(false)}
        summary={summary}
        onReset={() => {
          setSummaryOpen(false);
          resetSession();
        }}
      />

      <Modal open={pendingDatasetId !== null} onClose={() => setPendingDatasetId(null)} title="Switch scenario?" width="max-w-sm">
        <p className="text-[13px] leading-relaxed text-ink-muted">
          Your current session has trades or an open position. Switching resets the account back to $10,000 and clears
          this session's history.
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" full onClick={() => setPendingDatasetId(null)}>
            Stay here
          </Button>
          <Button variant="primary" full onClick={confirmSwitch}>
            Switch anyway
          </Button>
        </div>
      </Modal>
    </div>
  );
}
