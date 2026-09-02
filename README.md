# ShapeTrader

**Learn to read the market one shape at a time** — from a single candle, to a pattern, to a real
crash, to your first trade.

A browser game that teaches complete beginners two things at once: how to *read* a price chart, and
how to *use* a trading tool. Everything runs client-side with no backend, no API keys and no network
calls — open it and it works, including with the network unplugged.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts: `npm run typecheck`, `npm run test`, `npm run build`, `npm run preview`.

## The learning path

| Step | Module | What you actually *do* |
| --- | --- | --- |
| 1 | **Candle Lab** | Nine missions. In each one you **forge** the shape by dragging a candle until the classifier agrees it's a hammer, **spot** that shape hidden in a chart full of noise, then **call** what it means in context. The psychology only gets explained *after* you've built it. |
| 2 | **Shape Hunt** | Ten rounds. **Hunt** the pattern's landmark by clicking the chart ("click the head"), **name** it, then **call what happens next** — and watch the next 15 candles play out. Patterns resolve about 68% of the time, so you learn firsthand that a pattern is a probability, not a promise. |
| 3 | **Story Time** | Four true market stories — the dot-com bust, 2008, COVID, and a quiet bull run — told chapter by chapter, with the shapes you learned marked as they appear. |
| 4 | **Trading Floor** | Your own desk. Market vs limit orders, position sizing, stop loss and take profit, P&L — traded candle by candle so you can never see the future. |

Along the way: **Trophy Room** (levels, badges, streaks) and **Cheat Sheet** (every bit of jargon in plain English).

Progress, XP, levels, badges and streaks are tracked throughout and saved in the browser.

## Design decisions worth knowing

**Nothing is taught by reading it first.** Every shape is built, hunted or traded before it is
explained. The Candle Lab's forge stage completes the moment the app's own classifier agrees you've
made a hammer — the learner discovers the rule by hitting it, not by memorising it.

**Patterns are allowed to fail.** Shape Hunt resolves patterns as the textbook predicts about 68% of
the time, and scores you on whether you *read* it right rather than on the coin flip. A course where
every pattern works teaches a dangerous lie.

**Candles reveal one at a time in the simulator.** Any practice mode that shows the whole chart
teaches hindsight, not trading. Market orders fill at the *next* candle's open for the same reason.

**XP for a closed trade is flat, regardless of profit.** A game that pays more for a bigger win
teaches people to size up. Good risk habits are rewarded through badges instead — the *Risk
Manager* badge needs three trades closed with a stop loss set.

**Wrong answers still earn XP (2 instead of 10).** Nothing about a beginner's first hour should
punish them for being a beginner.

**Every generated chart comes from a seeded PRNG,** never `Math.random()`. A question that looks
wrong can be reproduced exactly from its seed.

**The classifier is the source of truth.** The thresholds quoted in the lessons (a doji's body is
under 10% of its range, a marubozu's is over 80%) are the same constants the code uses to verify a
generated candle really is the shape the quiz claims, so the teaching text and the behaviour cannot
drift apart.

**Historical data is stylised, and says so.** The case studies are index-normalised reconstructions
built from hand-picked anchor points that match what really happened in magnitude and timing — not
tick-accurate prices. That is stated in the UI rather than hidden.

## Architecture

```
src/
  components/chart/   PriceChart (TradingView lightweight-charts + synced SVG annotation overlay),
                      MiniCandles (cheap SVG thumbnails)
  components/ui/      Button, Card, Modal, ProgressRing
  components/feedback ChoiceGrid, AnswerFeedback, ToastHost, LevelUpModal
  data/               shape + pattern definitions, glossary, case-study datasets,
                      generator/ (seeded rng, anchor→candle path builder, random walk, synthesis)
  engine/             candles/ (classifier), trading/ (order engine, portfolio),
                      progress/ (xp, badges, summary), annotations/
  screens/            one folder per module
  store/              zustand + persist (progress, portfolio, transient UI)
```

**The chart is a hybrid.** `lightweight-charts` draws the candles — it is TradingView's own library,
so the chart looks like the real thing and handles scaling, panning and crosshairs. A custom SVG
overlay sits on top for the teaching geometry (necklines, trendlines, zones), resolved through the
chart's own `timeToCoordinate` / `priceToCoordinate` so annotations stay glued to their candles
while you pan and zoom.

**One generator behind every chart.** A price series is authored as anchor points, interpolated,
roughened with auto-correlated noise, then turned into OHLC candles. A textbook head & shoulders and
the 2008 crash are drawn by exactly the same code — only the anchors differ.

**Storage can never crash the app.** Every `localStorage` read goes through a try/catch wrapper with
a safe default, keys are namespaced and versioned, incompatible saved state is discarded rather than
half-loaded, and a root error boundary catches anything that still gets through.

## Built with

React 19 · TypeScript · Vite · Tailwind CSS v4 · lightweight-charts · Zustand · Framer Motion ·
lucide-react · Vitest. Fonts are bundled via `@fontsource`, not fetched from a CDN.
