import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { ShapeHunt } from './ShapeHunt';
import { PatternGallery } from './PatternGallery';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

/**
 * Shape Hunt — chart patterns taught by doing rather than by browsing. The
 * old Learn/Practice tabs are gone: the round loop (HuntStage → NameStage →
 * OutcomeStage, orchestrated by ShapeHunt) is the whole main path. The old
 * gallery survives as a reference "field guide" behind a modal, reachable
 * any time but never the default view.
 */
export function ChartPatternsScreen() {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className="animate-rise space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-[17px] font-semibold tracking-tight text-ink">Shape Hunt</h1>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
            Chart patterns are candlestick shapes zoomed out — the shapes a chart makes over dozens of bars, and
            what a crowd of traders was doing to make it. Don&apos;t just recognise them: mark the landmark, name
            the shape, then call what happens next before the chart tells you.
          </p>
        </div>
        <Button variant="outline" size="sm" icon={<BookOpen className="size-3.5" />} onClick={() => setGuideOpen(true)}>
          Field guide
        </Button>
      </div>

      <ShapeHunt />

      <Modal open={guideOpen} onClose={() => setGuideOpen(false)} title="Field guide" width="max-w-5xl">
        <div className="max-h-[75vh] overflow-y-auto pr-1">
          <PatternGallery />
        </div>
      </Modal>
    </div>
  );
}
