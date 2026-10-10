import { DOODLE_H, DOODLE_W, type Stroke } from '@/lib/guestbook';

const COLORS = ['var(--graphite)', 'var(--accent)'];

/**
 * SVG path for a flat [x0,y0,x1,y1,…] stroke, smoothed with quadratic curves through the
 * midpoints between samples so lines read as pencil strokes rather than joined segments.
 */
export function strokeToPath(p: number[]) {
  const n = p.length / 2;
  if (n === 1) return `M${p[0]} ${p[1]}l0.1 0`; // a tap: draw a dot
  if (n === 2) return `M${p[0]} ${p[1]}L${p[2]} ${p[3]}`;
  const r = (v: number) => Math.round(v * 10) / 10;
  let d = `M${r(p[0])} ${r(p[1])}`;
  for (let i = 1; i < n - 1; i++) {
    const x = p[i * 2], y = p[i * 2 + 1];
    const mx = (x + p[i * 2 + 2]) / 2, my = (y + p[i * 2 + 3]) / 2;
    d += `Q${r(x)} ${r(y)} ${r(mx)} ${r(my)}`;
  }
  return d + `L${r(p[n * 2 - 2])} ${r(p[n * 2 - 1])}`;
}

/** Read-only rendering of a stored doodle, run through the #pencil filter so it matches the site. */
export function DoodleSvg({ strokes, label }: { strokes: Stroke[]; label: string }) {
  return (
    <svg viewBox={`0 0 ${DOODLE_W} ${DOODLE_H}`} role="img" aria-label={label} style={{ display: 'block', width: '100%', height: 'auto' }}>
      <g fill="none" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" filter="url(#pencil2)">
        {strokes.map((s, i) => (
          <path key={i} d={strokeToPath(s.p)} stroke={COLORS[s.c]} />
        ))}
      </g>
    </svg>
  );
}
