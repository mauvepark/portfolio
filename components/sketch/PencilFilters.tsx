// SVG displacement filters that give .sketch borders and pencil rules their wobble.
// Rendered once in the root layout; referenced as url(#pencil) / url(#pencil2).
export function PencilFilters() {
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
      <defs>
        <filter id="pencil">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={3} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={3.2} />
        </filter>
        <filter id="pencil2">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={2} seed={9} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={2.6} />
        </filter>
      </defs>
    </svg>
  );
}

export function PencilRule() {
  return (
    <svg viewBox="0 0 1120 12" preserveAspectRatio="none" aria-hidden="true" style={{ display: 'block', width: '100%', height: 12 }}>
      <path
        d="M2 7 C 180 3, 320 10, 520 6 S 900 4, 1118 7"
        fill="none" stroke="var(--graphite)" strokeWidth={1.6} strokeLinecap="round" filter="url(#pencil)"
      />
    </svg>
  );
}

export function Hatch({ label, height, width, className }: { label: string; height?: number; width?: number; className?: string }) {
  return (
    <div className={className ? `hatch ${className}` : 'hatch'} style={{ height, width }}>
      <span className="hatch-label">[{label}]</span>
    </div>
  );
}
