import { DOODLE_H, DOODLE_W, type Stroke } from '@/lib/guestbook';

const COLORS = ['var(--graphite)', 'var(--accent)'];

export function strokeToPath(p: number[]) {
  let d = `M${p[0]} ${p[1]}`;
  for (let i = 2; i < p.length; i += 2) d += `L${p[i]} ${p[i + 1]}`;
  // A single tap is one point; draw it as a dot.
  if (p.length === 2) d += `l0.1 0`;
  return d;
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
