'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './Workbench.module.css';

const W = 240;
const H = 64;

/** Hand-drawn 30-day contribution line that sketches itself in when scrolled into view. */
export function Sparkline({ days }: { days: { date: string; count: number }[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setDrawn(true);
        io.disconnect();
      }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const max = Math.max(1, ...days.map((d) => d.count));
  const step = W / Math.max(1, days.length - 1);
  const pts = days.map((d, i) => [i * step, H - 6 - (d.count / max) * (H - 14)] as const);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
  const peak = pts[days.findIndex((d) => d.count === max)];
  const busiest = days.find((d) => d.count === max);

  return (
    <svg
      ref={ref}
      viewBox={`-4 -4 ${W + 8} ${H + 8}`}
      className={styles.spark}
      role="img"
      aria-label={`Contributions over the last ${days.length} days, peaking at ${max} on ${busiest?.date}`}
    >
      <path d={`M0 ${H - 2} L${W} ${H - 2}`} className={styles.baseline} />
      <path d={line} pathLength={1} className={styles.sparkLine} data-drawn={drawn} />
      {peak && max > 0 && <circle cx={peak[0]} cy={peak[1]} r={4} className={styles.peak} data-drawn={drawn} />}
    </svg>
  );
}
