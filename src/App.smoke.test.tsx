// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { CASE_STUDIES } from '@/data/caseStudies';

/**
 * The chart library draws to a real canvas, which jsdom does not provide. Its
 * own lifecycle is exercised in the browser; what matters here is that every
 * screen around it mounts cleanly from a completely empty localStorage — the
 * exact state an interviewer's browser will be in.
 */
vi.mock('@/components/chart/PriceChart', () => ({
  PriceChart: () => <div data-testid="price-chart" />,
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const ROUTES = [
  ['/', 'Learn to read the market'],
  ['/candlesticks', 'Candle Lab'],
  ['/patterns', 'Shape Hunt'],
  ['/case-studies', 'Four true stories'],
  ['/simulator', 'Scenario'],
  ['/progress', 'Badges'],
  ['/glossary', 'Trading jargon'],
] as const;

describe('every screen renders from a clean slate', () => {
  ROUTES.forEach(([path, marker]) => {
    it(`renders ${path} without crashing`, () => {
      renderAt(path);
      expect(screen.getAllByText(/ShapeTrader/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(new RegExp(marker, 'i')).length).toBeGreaterThan(0);
    });
  });

  it('renders each case study walkthrough', () => {
    CASE_STUDIES.forEach((study) => {
      renderAt(`/case-studies/${study.id}`);
      expect(screen.getAllByText(/Chapter 1 of/i).length).toBeGreaterThan(0);
      cleanup();
    });
  });

  it('shows a friendly message for an unknown case study instead of crashing', () => {
    renderAt('/case-studies/not-a-real-event');
    expect(screen.getByText(/story is missing/i)).toBeTruthy();
  });

  it('sends unknown routes back home', () => {
    renderAt('/some/deleted/page');
    expect(screen.getAllByText(/Learn to read the market/i).length).toBeGreaterThan(0);
  });

  it('survives corrupt saved progress', () => {
    window.localStorage.setItem('shapetrader:progress:v1', '{ this is not json');
    renderAt('/progress');
    expect(screen.getAllByText(/Badges/i).length).toBeGreaterThan(0);
  });
});
