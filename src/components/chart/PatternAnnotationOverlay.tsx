import { TONE_COLORS, type Annotation } from '@/engine/annotations/types';

export interface CoordinateMapper {
  x: (index: number) => number | null;
  y: (price: number) => number | null;
  width: number;
  height: number;
}

/**
 * Draws the teaching geometry — necklines, trendlines, support zones — on top
 * of the chart canvas. Every coordinate is resolved through the chart's own
 * time/price scales, so the marks stay glued to their candles while the user
 * pans and zooms. Anything that maps off-screen is simply skipped.
 */
export function PatternAnnotationOverlay({
  annotations,
  map,
}: {
  annotations: Annotation[];
  map: CoordinateMapper;
}) {
  if (map.width === 0 || map.height === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={map.width}
      height={map.height}
      aria-hidden
    >
      {annotations.map((ann) => {
        const color = TONE_COLORS[ann.tone ?? 'brand'];
        const dash = ann.dashed ? '5 4' : undefined;

        if (ann.kind === 'line' && ann.points.length >= 2) {
          const [a, b] = ann.points;
          const x1 = map.x(a.index);
          const y1 = map.y(a.price);
          const x2 = map.x(b.index);
          const y2 = map.y(b.price);
          if (x1 === null || y1 === null || x2 === null || y2 === null) return null;
          return (
            <g key={ann.id}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={1.75}
                strokeDasharray={dash}
                strokeLinecap="round"
              />
              {ann.label ? <Label x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 10} text={ann.label} color={color} /> : null}
            </g>
          );
        }

        if (ann.kind === 'zone' && ann.points.length >= 2) {
          const [a, b] = ann.points;
          const x1 = map.x(a.index);
          const x2 = map.x(b.index);
          const y1 = map.y(a.price);
          const y2 = map.y(b.price);
          if (x1 === null || x2 === null || y1 === null || y2 === null) return null;
          const left = Math.min(x1, x2);
          const top = Math.min(y1, y2);
          return (
            <g key={ann.id}>
              <rect
                x={left}
                y={top}
                width={Math.abs(x2 - x1)}
                height={Math.max(Math.abs(y2 - y1), 2)}
                fill={color}
                fillOpacity={0.1}
                stroke={color}
                strokeOpacity={0.55}
                strokeDasharray={dash}
                rx={2}
              />
              {ann.label ? <Label x={left + 6} y={top - 8} text={ann.label} color={color} anchor="start" /> : null}
            </g>
          );
        }

        if (ann.kind === 'band' && ann.points.length >= 2) {
          const y1 = map.y(ann.points[0].price);
          const y2 = map.y(ann.points[1].price);
          if (y1 === null || y2 === null) return null;
          const top = Math.min(y1, y2);
          return (
            <g key={ann.id}>
              <rect
                x={0}
                y={top}
                width={map.width}
                height={Math.max(Math.abs(y2 - y1), 2)}
                fill={color}
                fillOpacity={0.08}
              />
              <line x1={0} x2={map.width} y1={y1} y2={y1} stroke={color} strokeWidth={1.25} strokeDasharray="5 4" />
              <line x1={0} x2={map.width} y1={y2} y2={y2} stroke={color} strokeWidth={1.25} strokeDasharray="5 4" />
              {ann.label ? <Label x={8} y={top - 8} text={ann.label} color={color} anchor="start" /> : null}
            </g>
          );
        }

        if (ann.kind === 'span' && ann.points.length >= 2) {
          const x1 = map.x(ann.points[0].index);
          const x2 = map.x(ann.points[1].index);
          if (x1 === null || x2 === null) return null;
          const left = Math.min(x1, x2);
          const width = Math.max(Math.abs(x2 - x1), 6);
          return (
            <g key={ann.id}>
              <rect x={left - 3} y={0} width={width + 6} height={map.height} fill={color} fillOpacity={0.09} />
              <line x1={left - 3} x2={left - 3} y1={0} y2={map.height} stroke={color} strokeOpacity={0.5} strokeWidth={1} />
              <line
                x1={left + width + 3}
                x2={left + width + 3}
                y1={0}
                y2={map.height}
                stroke={color}
                strokeOpacity={0.5}
                strokeWidth={1}
              />
              {ann.label ? <Label x={left + width / 2} y={16} text={ann.label} color={color} /> : null}
            </g>
          );
        }

        if (ann.kind === 'marker' && ann.points.length >= 1) {
          const x = map.x(ann.points[0].index);
          const y = map.y(ann.points[0].price);
          if (x === null || y === null) return null;
          return (
            <g key={ann.id}>
              <circle cx={x} cy={y} r={4.5} fill={color} fillOpacity={0.25} stroke={color} strokeWidth={1.5} />
              {ann.label ? <Label x={x} y={y - 12} text={ann.label} color={color} /> : null}
            </g>
          );
        }

        return null;
      })}
    </svg>
  );
}

function Label({
  x,
  y,
  text,
  color,
  anchor = 'middle',
}: {
  x: number;
  y: number;
  text: string;
  color: string;
  anchor?: 'start' | 'middle';
}) {
  const width = text.length * 6.2 + 12;
  const left = anchor === 'middle' ? x - width / 2 : x;
  return (
    <g>
      <rect x={left} y={y - 11} width={width} height={17} rx={4} fill="#0a0d12" fillOpacity={0.85} stroke={color} strokeOpacity={0.4} />
      <text
        x={anchor === 'middle' ? x : x + width / 2}
        y={y + 1}
        textAnchor="middle"
        fontSize={10.5}
        fontWeight={600}
        fill={color}
        style={{ fontFamily: 'Inter Variable, sans-serif' }}
      >
        {text}
      </text>
    </g>
  );
}
