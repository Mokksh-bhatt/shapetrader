export type GlossaryCategory = 'Charts' | 'Orders' | 'Risk' | 'Market';

export interface GlossaryTerm {
  id: string;
  term: string;
  category: GlossaryCategory;
  /** One sentence a complete beginner can act on. */
  plain: string;
  /** The nuance that stops the beginner definition becoming a bad habit. */
  detail?: string;
}

export const GLOSSARY: GlossaryTerm[] = [
  {
    id: 'candlestick',
    term: 'Candlestick',
    category: 'Charts',
    plain:
      'One bar on the chart, showing four prices for a period: where it opened, closed, and the highest and lowest it traded.',
    detail:
      'The thick part is the body (open to close). The thin lines are wicks (or shadows) — the extremes price reached but did not hold.',
  },
  {
    id: 'ohlc',
    term: 'OHLC',
    category: 'Charts',
    plain: 'Open, High, Low, Close — the four numbers every candle is drawn from.',
  },
  {
    id: 'wick',
    term: 'Wick (shadow)',
    category: 'Charts',
    plain: 'The thin line above or below a candle body, showing a price that was reached and rejected.',
    detail:
      'Long wicks are the most information-dense part of a candle: they mark where someone came in and pushed price back.',
  },
  {
    id: 'trend',
    term: 'Trend',
    category: 'Charts',
    plain:
      'The general direction of price. An uptrend makes higher highs and higher lows; a downtrend makes lower highs and lower lows.',
    detail:
      'Everything else in technical analysis is context-dependent on this. The same candle means opposite things in an uptrend and a downtrend.',
  },
  {
    id: 'support',
    term: 'Support',
    category: 'Charts',
    plain: 'A price area where buyers have repeatedly stepped in and stopped the fall.',
    detail:
      'It is a zone, not a precise line. Once broken, old support often becomes resistance — the people who bought there are now trying to get out at breakeven.',
  },
  {
    id: 'resistance',
    term: 'Resistance',
    category: 'Charts',
    plain: 'A price area where sellers have repeatedly stepped in and capped the rise.',
  },
  {
    id: 'breakout',
    term: 'Breakout',
    category: 'Charts',
    plain: 'When price finally pushes through a support or resistance level it had been respecting.',
    detail:
      'Plenty of breakouts fail and snap straight back ("fakeout"). Volume expanding on the break is the usual sanity check.',
  },
  {
    id: 'volume',
    term: 'Volume',
    category: 'Market',
    plain: 'How many shares changed hands in the period — the bars along the bottom of a chart.',
    detail:
      'Volume is the conviction behind a move. A breakout on low volume is a rumour; on high volume it is a decision.',
  },
  {
    id: 'volatility',
    term: 'Volatility',
    category: 'Market',
    plain: 'How much price swings around. High volatility means bigger, faster moves in both directions.',
  },
  {
    id: 'liquidity',
    term: 'Liquidity',
    category: 'Market',
    plain: 'How easily you can buy or sell without moving the price much.',
  },
  {
    id: 'bull-bear',
    term: 'Bullish / Bearish',
    category: 'Market',
    plain: 'Bullish means expecting price to rise; bearish means expecting it to fall.',
    detail: 'A bull thrusts its horns up; a bear swipes its paw down. That is genuinely where it comes from.',
  },
  {
    id: 'market-order',
    term: 'Market order',
    category: 'Orders',
    plain: 'Buy or sell right now at whatever the next available price is.',
    detail:
      'It always fills, but you do not control the price. In a fast market the fill can be worse than the price you saw — that gap is called slippage.',
  },
  {
    id: 'limit-order',
    term: 'Limit order',
    category: 'Orders',
    plain: 'Buy or sell only at your specified price or better. It waits until the market comes to you.',
    detail:
      'You control the price but not whether it fills. If price never reaches your limit, you simply do not get the trade.',
  },
  {
    id: 'stop-loss',
    term: 'Stop loss',
    category: 'Risk',
    plain: 'A pre-set exit that closes your position automatically if price moves against you by a set amount.',
    detail:
      'Decided before you enter, when you are calm. Its job is to make the worst case a number you chose rather than a number the market chose.',
  },
  {
    id: 'take-profit',
    term: 'Take profit',
    category: 'Risk',
    plain: 'A pre-set exit that closes your position automatically once it reaches your target gain.',
  },
  {
    id: 'position-size',
    term: 'Position size',
    category: 'Risk',
    plain: 'How much you buy. Usually the single biggest driver of whether a bad trade hurts or ends you.',
    detail:
      'A common beginner rule: risk no more than 1–2% of the account on a single trade. Size is worked backwards from where your stop sits, not from how confident you feel.',
  },
  {
    id: 'risk-reward',
    term: 'Risk/reward ratio',
    category: 'Risk',
    plain: 'How much you stand to gain compared with what you are risking. 1:2 means risking $1 to make $2.',
    detail:
      'With 1:2 you can be wrong more often than right and still come out ahead. This is why professionals talk about expectancy, not accuracy.',
  },
  {
    id: 'drawdown',
    term: 'Drawdown',
    category: 'Risk',
    plain: 'How far your account has fallen from its high point.',
    detail: 'A 50% drawdown needs a 100% gain to recover. Avoiding deep holes matters more than digging fast.',
  },
  {
    id: 'pnl',
    term: 'P&L',
    category: 'Risk',
    plain: 'Profit and loss. Unrealised P&L is on paper while you hold; realised P&L is locked in once you close.',
  },
  {
    id: 'long-short',
    term: 'Long / Short',
    category: 'Orders',
    plain: 'Long means you own it and profit if it rises. Short means you borrowed and sold it, profiting if it falls.',
  },
  {
    id: 'spread',
    term: 'Spread',
    category: 'Orders',
    plain: 'The gap between the best buy price (bid) and the best sell price (ask). It is a cost you pay on entry.',
  },
  {
    id: 'gap',
    term: 'Gap',
    category: 'Charts',
    plain: "When a candle opens well away from the previous candle's close, leaving a hole in the chart.",
    detail: 'Usually caused by news arriving while the market was shut. A stop loss cannot protect you inside a gap.',
  },
  {
    id: 'reversal',
    term: 'Reversal',
    category: 'Charts',
    plain: 'When a trend stops and turns the other way.',
  },
  {
    id: 'continuation',
    term: 'Continuation',
    category: 'Charts',
    plain: 'A pause in a trend that resolves in the same direction it was already going.',
  },
  {
    id: 'consolidation',
    term: 'Consolidation',
    category: 'Charts',
    plain: 'A quiet, sideways stretch where price coils in a range instead of trending.',
    detail: 'Ranges tend to end with an expansion — which is why patterns like triangles form here.',
  },
  {
    id: 'confirmation',
    term: 'Confirmation',
    category: 'Charts',
    plain: 'Waiting for the next candle or a level break to agree with your read before acting.',
    detail:
      'It costs you a slightly worse entry and saves you from a large share of patterns that never complete.',
  },
  {
    id: 'timeframe',
    term: 'Timeframe',
    category: 'Charts',
    plain: 'How much time one candle represents — a day, a week, five minutes.',
    detail:
      'The same pattern on a weekly chart is a far bigger deal than on a 5-minute chart. Always know which one you are looking at.',
  },
  {
    id: 'paper-trading',
    term: 'Paper trading',
    category: 'Market',
    plain: 'Practising with fake money and real prices — exactly what the simulator in this app does.',
    detail:
      'It teaches mechanics and pattern recognition well. It cannot teach you how you will feel when the money is real, so expect that part to be harder.',
  },
];

export const GLOSSARY_BY_ID = Object.fromEntries(GLOSSARY.map((t) => [t.id, t]));
