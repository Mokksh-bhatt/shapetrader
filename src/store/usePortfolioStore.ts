import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Candle } from '@/engine/candles/types';
import {
  advanceCandle,
  cancelOrder as cancelOrderEngine,
  createPortfolio,
  expireRestingOrders,
  submitOrder as submitOrderEngine,
  updatePositionRisk as updatePositionRiskEngine,
} from '@/engine/trading/portfolio';
import type { OrderRequest, PortfolioState } from '@/engine/trading/types';
import { PORTFOLIO_KEY, SIM_STARTING_CASH, STORAGE_VERSION } from '@/lib/constants';
import { safeStorage } from '@/lib/storage';
import { useProgressStore } from '@/store/useProgressStore';
import { useUiStore } from '@/store/useUiStore';

/** Candles shown before playback starts — an empty chart with one bar isn't
 *  a chart, it's a dot. */
export const INITIAL_VISIBLE_CANDLES = 20;

export const SPEED_OPTIONS = [0.5, 1, 2, 4] as const;
export type PlaybackSpeed = (typeof SPEED_OPTIONS)[number];

interface PortfolioStoreState {
  version: number;
  datasetId: string | null;
  /** Transient — never persisted. Regenerated from `datasetId` on mount since
   *  the datasets are deterministic (seeded), which keeps localStorage small. */
  candles: Candle[];
  candleIndex: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  sessionEnded: boolean;
  portfolio: PortfolioState;
}

interface PortfolioStoreActions {
  /** Called on mount to give a rehydrated session its candle data back. */
  hydrateCandles: (datasetId: string, candles: Candle[]) => void;
  /** Called when the trader picks a (possibly new) dataset — full reset. */
  loadDataset: (datasetId: string, candles: Candle[]) => void;
  resetSession: () => void;
  play: () => void;
  pause: () => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  revealNext: () => void;
  submitOrder: (request: OrderRequest) => { ok: true } | { ok: false; reason: string };
  cancelOrder: (orderId: string) => void;
  updatePositionRisk: (input: { stopLoss?: number | null; takeProfit?: number | null }) => void;
}

type Store = PortfolioStoreState & PortfolioStoreActions;

function initialState(): PortfolioStoreState {
  return {
    version: STORAGE_VERSION,
    datasetId: null,
    candles: [],
    candleIndex: -1,
    isPlaying: false,
    speed: 1,
    sessionEnded: false,
    portfolio: createPortfolio(SIM_STARTING_CASH),
  };
}

function startIndex(candleCount: number): number {
  if (candleCount <= 0) return -1;
  return Math.min(INITIAL_VISIBLE_CANDLES, candleCount) - 1;
}

export const usePortfolioStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState(),

      hydrateCandles: (datasetId, candles) => {
        const s = get();
        if (s.datasetId !== datasetId || s.candles.length > 0) return;
        const clamped = s.candleIndex >= 0 ? Math.min(s.candleIndex, candles.length - 1) : startIndex(candles.length);
        set({ candles, candleIndex: clamped });
      },

      loadDataset: (datasetId, candles) => {
        set({ ...initialState(), datasetId, candles, candleIndex: startIndex(candles.length) });
      },

      resetSession: () => {
        const s = get();
        set({
          ...initialState(),
          datasetId: s.datasetId,
          candles: s.candles,
          candleIndex: startIndex(s.candles.length),
        });
      },

      play: () => {
        const s = get();
        if (s.sessionEnded || s.candles.length === 0) return;
        if (s.candleIndex >= s.candles.length - 1) return;
        set({ isPlaying: true });
      },

      pause: () => set({ isPlaying: false }),

      setSpeed: (speed) => set({ speed }),

      revealNext: () => {
        const s = get();
        if (s.sessionEnded || s.candles.length === 0) return;

        const nextIndex = s.candleIndex + 1;
        if (nextIndex >= s.candles.length) {
          // Never run playback past the end of the data — stop cleanly and
          // expire anything still resting instead of leaving it in limbo.
          set({ isPlaying: false, sessionEnded: true, portfolio: expireRestingOrders(s.portfolio, s.candleIndex) });
          return;
        }

        const candle = s.candles[nextIndex];
        const { portfolio, events } = advanceCandle(s.portfolio, candle, nextIndex);
        const ui = useUiStore.getState();

        for (const event of events) {
          if (event.kind === 'filled') {
            ui.pushToast({
              kind: 'success',
              title: `${event.order.side === 'buy' ? 'Bought' : 'Sold'} ${event.order.qty} @ ${(event.order.filledPrice ?? 0).toFixed(2)}`,
              detail: event.order.note,
            });
          } else {
            const won = event.trade.pnl > 0;
            const reasonLabel =
              event.trade.reason === 'stop-loss'
                ? 'stop loss hit'
                : event.trade.reason === 'take-profit'
                  ? 'take profit hit'
                  : 'closed';
            ui.pushToast({
              kind: won ? 'success' : 'error',
              title: `Position ${reasonLabel}`,
              detail: `${won ? '+' : ''}${event.trade.pnl.toFixed(2)} P&L`,
            });
            // Flat XP either way — the game must never pay the learner for
            // gambling. Good habits (setting a stop) earn a badge instead.
            useProgressStore
              .getState()
              .recordTradeClose({ pnl: event.trade.pnl, hadRiskControls: event.trade.hadRiskControls });
          }
        }

        const isLast = nextIndex >= s.candles.length - 1;
        const finalPortfolio = isLast ? expireRestingOrders(portfolio, nextIndex) : portfolio;

        set({
          candleIndex: nextIndex,
          portfolio: finalPortfolio,
          isPlaying: isLast ? false : s.isPlaying,
          sessionEnded: isLast,
        });
      },

      submitOrder: (request) => {
        const s = get();
        const candle = s.candles[s.candleIndex];
        if (!candle) return { ok: false, reason: 'No market data loaded yet' };

        const result = submitOrderEngine(s.portfolio, request, s.candleIndex, candle.close);
        if ('error' in result) return { ok: false, reason: result.error };

        set({ portfolio: result.portfolio });
        useUiStore.getState().pushToast({
          kind: 'info',
          title: `${request.side === 'buy' ? 'Buy' : 'Sell'} order placed`,
          detail:
            request.type === 'market'
              ? 'Will fill at the next candle’s open'
              : `Resting at ${request.limitPrice} until it fills or is cancelled`,
        });
        return { ok: true };
      },

      cancelOrder: (orderId) => {
        const s = get();
        set({ portfolio: cancelOrderEngine(s.portfolio, orderId, s.candleIndex) });
      },

      updatePositionRisk: (input) => {
        const s = get();
        const result = updatePositionRiskEngine(s.portfolio, input);
        if ('error' in result) {
          useUiStore.getState().pushToast({ kind: 'error', title: 'Could not update stop / target', detail: result.error });
          return;
        }
        set({ portfolio: result.portfolio });
      },
    }),
    {
      name: PORTFOLIO_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => safeStorage),
      // Anything saved by an older, incompatible build is discarded rather
      // than half-loaded into a shape the UI no longer understands.
      migrate: () => initialState(),
      partialize: (state) => {
        const {
          hydrateCandles,
          loadDataset,
          resetSession,
          play,
          pause,
          setSpeed,
          revealNext,
          submitOrder,
          cancelOrder,
          updatePositionRisk,
          candles,
          ...data
        } = state;
        // Never persist the candle array (regenerated from datasetId) or a
        // live "playing" flag (a reload should never resume a running timer).
        return { ...data, isPlaying: false };
      },
    },
  ),
);
