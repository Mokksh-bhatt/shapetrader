export type AnnotationTone = 'brand' | 'bull' | 'bear' | 'gold' | 'violet' | 'neutral';

export interface AnnotationPoint {
  /** Index into the candle array the annotation is drawn over. */
  index: number;
  price: number;
}

/**
 * A teaching mark drawn over a chart. Kept in candle-index + price space so it
 * survives panning and zooming — the overlay converts to pixels at paint time.
 */
export interface Annotation {
  id: string;
  kind: 'line' | 'zone' | 'band' | 'marker' | 'span';
  /** line: 2 points · zone: 2 opposite corners · band: 2 prices · marker: 1 · span: 2 indexes */
  points: AnnotationPoint[];
  label?: string;
  tone?: AnnotationTone;
  dashed?: boolean;
}

export const TONE_COLORS: Record<AnnotationTone, string> = {
  brand: '#4c8dff',
  bull: '#26a69a',
  bear: '#ef5350',
  gold: '#f5b942',
  violet: '#a78bfa',
  neutral: '#98a2b6',
};
