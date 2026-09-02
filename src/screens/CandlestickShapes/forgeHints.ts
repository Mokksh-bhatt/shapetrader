import { RULES, getMetrics } from '@/engine/candles/candleClassifier';
import type { Candle, ShapeId } from '@/engine/candles/types';

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

/**
 * Live coaching text for the forge stage — always testing against the exact
 * thresholds candleClassifier uses, in the order classify() would fail them,
 * so the hint never contradicts what "Show me" or the classifier itself do.
 */
export function forgeHint(shapeId: ShapeId, candles: Candle[]): string {
  const cur = candles[candles.length - 1];
  if (!cur) return '';
  const prev = candles.length > 1 ? candles[candles.length - 2] : undefined;
  const m = getMetrics(cur);

  switch (shapeId) {
    case 'doji':
      return `Body is ${pct(m.bodyRatio)} of the range — a doji needs it under ${pct(RULES.dojiMaxBody)}. Drag open and close together.`;

    case 'hammer': {
      if (m.bodyRatio >= RULES.spinningTopMaxBody)
        return `Body is ${pct(m.bodyRatio)} of the range — shrink it under ${pct(RULES.spinningTopMaxBody)} first.`;
      if (m.upperWickRatio > RULES.shortWickMax)
        return `Upper wick is ${pct(m.upperWickRatio)} of the range — trim it under ${pct(RULES.shortWickMax)}.`;
      const mult = m.body > 0 ? m.lowerWick / m.body : 0;
      return `Lower wick is ${mult.toFixed(1)}x the body — needs to be at least ${RULES.longWickMultiple}x. Drag the low handle further down.`;
    }

    case 'shootingStar': {
      if (m.bodyRatio >= RULES.spinningTopMaxBody)
        return `Body is ${pct(m.bodyRatio)} of the range — shrink it under ${pct(RULES.spinningTopMaxBody)} first.`;
      if (m.lowerWickRatio > RULES.shortWickMax)
        return `Lower wick is ${pct(m.lowerWickRatio)} of the range — trim it under ${pct(RULES.shortWickMax)}.`;
      const mult = m.body > 0 ? m.upperWick / m.body : 0;
      return `Upper wick is ${mult.toFixed(1)}x the body — needs to be at least ${RULES.longWickMultiple}x. Drag the high handle further up.`;
    }

    case 'bullishMarubozu':
    case 'bearishMarubozu': {
      const wantUp = shapeId === 'bullishMarubozu';
      if (m.bodyRatio < RULES.marubozuMinBody)
        return `Body is ${pct(m.bodyRatio)} of the range — a marubozu needs at least ${pct(RULES.marubozuMinBody)}. Shrink both wicks.`;
      return `Body is big enough, but it's closing the wrong way — drag the close ${wantUp ? 'above' : 'below'} the open.`;
    }

    case 'spinningTop': {
      if (m.bodyRatio > RULES.spinningTopMaxBody)
        return `Body is ${pct(m.bodyRatio)} of the range — shrink it under ${pct(RULES.spinningTopMaxBody)}.`;
      if (m.upperWickRatio <= RULES.shortWickMax)
        return `Upper wick is only ${pct(m.upperWickRatio)} of the range — stretch it out past ${pct(RULES.shortWickMax)}.`;
      return `Lower wick is only ${pct(m.lowerWickRatio)} of the range — stretch it out past ${pct(RULES.shortWickMax)}.`;
    }

    case 'bullishEngulfing':
    case 'bearishEngulfing': {
      if (!prev) return 'This one needs two candles.';
      const wantUp = shapeId === 'bullishEngulfing';
      const pm = getMetrics(prev);
      if (m.isUp !== wantUp)
        return `Candle 2 needs to close ${wantUp ? 'above' : 'below'} where it opened — drag its close ${wantUp ? 'up' : 'down'}.`;
      const opensPast = wantUp ? cur.open < prev.close : cur.open > prev.close;
      if (!opensPast)
        return `Candle 2 needs to open ${wantUp ? 'below' : 'above'} candle 1's close — drag its open ${wantUp ? 'down' : 'up'}.`;
      const closesPast = wantUp ? cur.close > prev.open : cur.close < prev.open;
      if (!closesPast)
        return `Candle 2 needs to close ${wantUp ? 'above' : 'below'} candle 1's open — drag its close further ${wantUp ? 'up' : 'down'}.`;
      if (m.body <= pm.body)
        return "Candle 2's body needs to be bigger than candle 1's — stretch it out further.";
      return 'Nearly there — keep going.';
    }

    default:
      return '';
  }
}
