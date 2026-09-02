import { useEffect, useRef, useState } from 'react';
import {
  CandlestickSeries,
  CrosshairMode,
  HistogramSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts';
import type { Candle } from '@/engine/candles/types';
import type { Annotation } from '@/engine/annotations/types';
import { PatternAnnotationOverlay, type CoordinateMapper } from './PatternAnnotationOverlay';
import { cn } from '@/lib/cn';

const THEME = {
  bg: '#11151d',
  text: '#98a2b6',
  grid: '#1b2230',
  border: '#232b38',
  bull: '#26a69a',
  bear: '#ef5350',
};

interface PriceChartProps {
  candles: Candle[];
  height?: number;
  annotations?: Annotation[];
  fitContent?: boolean;
  showVolume?: boolean;
  /** Ticker-style label drawn in the top-left, TradingView style. */
  legendLabel?: string;
  className?: string;
}

/**
 * The real chart. lightweight-charts (TradingView's own library) draws the
 * candles; a synced SVG overlay draws the teaching annotations on top.
 *
 * Lifecycle rules that keep it from going blank mid-demo:
 *  - the chart is created exactly once and torn down on unmount
 *  - data updates go through setData, never a remount
 *  - a ResizeObserver keeps both the canvas and the overlay in step
 */
export function PriceChart({
  candles,
  height = 380,
  annotations = [],
  fitContent = true,
  showVolume = false,
  legendLabel,
  className,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // Bumped whenever the pixel mapping may have changed (pan, zoom, resize,
  // new data) so the overlay re-resolves its coordinates.
  const [paint, setPaint] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hovered, setHovered] = useState<Candle | null>(null);

  /**
   * Callers frequently pass a freshly-built array every render — `candles.slice(0, i)`
   * during simulator playback, for instance. Keying the data effect on array
   * identity would then re-run it on every paint and spin forever, so it keys on
   * a cheap content signature instead and reads the latest array from a ref.
   */
  const candlesRef = useRef(candles);
  candlesRef.current = candles;
  const last = candles[candles.length - 1];
  const signature = `${candles.length}|${candles[0]?.time ?? ''}|${last?.time ?? ''}|${last?.close ?? ''}`;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { color: THEME.bg },
        textColor: THEME.text,
        fontFamily: 'Inter Variable, ui-sans-serif, system-ui, sans-serif',
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: THEME.grid },
        horzLines: { color: THEME.grid },
      },
      rightPriceScale: { borderColor: THEME.border, scaleMargins: { top: 0.12, bottom: showVolume ? 0.28 : 0.1 } },
      timeScale: { borderColor: THEME.border, rightOffset: 2, fixLeftEdge: true },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#465064', width: 1, style: 3, labelBackgroundColor: '#1f2632' },
        horzLine: { color: '#465064', width: 1, style: 3, labelBackgroundColor: '#1f2632' },
      },
      handleScale: { axisPressedMouseMove: { time: true, price: false } },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: THEME.bull,
      downColor: THEME.bear,
      wickUpColor: THEME.bull,
      wickDownColor: THEME.bear,
      borderVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    if (showVolume) {
      const volume = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      volume.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      volumeRef.current = volume;
    }

    const repaint = () => setPaint((p) => p + 1);
    chart.timeScale().subscribeVisibleLogicalRangeChange(repaint);

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setSize({ width: rect.width, height: rect.height });
      repaint();
    });
    observer.observe(el);
    setSize({ width: el.clientWidth, height: el.clientHeight });

    return () => {
      observer.disconnect();
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(repaint);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeRef.current = null;
    };
  }, [showVolume]);

  // Data updates — never a remount, so pan/zoom state and the canvas survive.
  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart) return;

    const data = candlesRef.current;
    series.setData(
      data.map((c) => ({
        time: c.time as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );

    if (volumeRef.current) {
      volumeRef.current.setData(
        data.map((c) => ({
          time: c.time as Time,
          value: c.volume ?? 0,
          color: c.close >= c.open ? 'rgba(38,166,154,0.35)' : 'rgba(239,83,80,0.35)',
        })),
      );
    }

    if (fitContent) chart.timeScale().fitContent();
    setHovered(null);
    setPaint((p) => p + 1);
  }, [signature, fitContent]);

  // Hovered-candle readout, so the learner can inspect any bar's OHLC.
  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    const handler = (param: { time?: Time }) => {
      if (!param.time) {
        setHovered(null);
        return;
      }
      const match = candlesRef.current.find((c) => c.time === param.time);
      setHovered(match ?? null);
    };

    chart.subscribeCrosshairMove(handler);
    return () => chart.unsubscribeCrosshairMove(handler);
    // re-subscribes if the chart itself was rebuilt (showVolume toggles it)
  }, [showVolume]);

  const readout = hovered ?? candles[candles.length - 1] ?? null;

  const mapper: CoordinateMapper = {
    width: size.width,
    height: size.height,
    x: (index) => {
      const chart = chartRef.current;
      const candle = candles[index];
      if (!chart || !candle) return null;
      const coord = chart.timeScale().timeToCoordinate(candle.time as Time);
      return coord === null ? null : Number(coord);
    },
    y: (price) => {
      const series = seriesRef.current;
      if (!series || !Number.isFinite(price)) return null;
      const coord = series.priceToCoordinate(price);
      return coord === null ? null : Number(coord);
    },
  };

  return (
    <div className={cn('relative overflow-hidden rounded-xl border border-line bg-surface', className)}>
      <div ref={containerRef} style={{ height }} className="w-full" />

      {/* key forces a fresh render whenever the mapping changed */}
      <PatternAnnotationOverlay key={paint} annotations={annotations} map={mapper} />

      {(legendLabel || readout) && (
        <div className="pointer-events-none absolute left-3 top-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          {legendLabel ? <span className="font-semibold text-ink">{legendLabel}</span> : null}
          {readout ? (
            <span className="tnum flex gap-2 text-ink-muted">
              <span>O {readout.open.toFixed(2)}</span>
              <span>H {readout.high.toFixed(2)}</span>
              <span>L {readout.low.toFixed(2)}</span>
              <span className={readout.close >= readout.open ? 'text-bull' : 'text-bear'}>
                C {readout.close.toFixed(2)}
              </span>
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
