'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A pencil squiggle that draws itself in (stroke-dashoffset) the first time it scrolls into view.
 * Re-mount it with a new `key` to replay the stroke.
 */
export function DrawnUnderline({ color = 'var(--accent)', width = '100%', delay = 0 }: { color?: string; width?: number | string; delay?: number }) {
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
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <svg ref={ref} viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden="true" style={{ display: 'block', width, height: 14, overflow: 'visible' }}>
      <path
        d="M3 9 C 60 4, 110 12, 170 7 S 260 5, 297 8"
        pathLength={1}
        fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" filter="url(#pencil2)"
        className="draw-stroke"
        data-drawn={drawn}
        style={{ animationDelay: `${delay}ms` }}
      />
    </svg>
  );
}
