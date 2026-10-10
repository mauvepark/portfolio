import styles from './Cat.module.css';

// A tapered leg from the body (top x) down to a small forward-pointing paw (bottom x).
const leg = (xt: number, xb: number) =>
  `M${xt - 2.3} 37 C${xt - 2.1} 45, ${xb - 1.3} 50, ${xb - 1.3} 54.6 Q${xb - 1.3} 56 ${xb} 56 ` +
  `L${xb + 1.9} 56 Q${xb + 2.7} 56 ${xb + 1.3} 54.4 C${xb + 1.3} 50, ${xt + 2.3} 45, ${xt + 2.3} 37 Z`;

// Side-on black cat silhouette, facing right: round head, big round eyes, arched back,
// rounded haunch and an S-curved tail, softened by the pencil filter. Each part is its
// own element so Cat.module.css can animate it per pose (legs step, tail swishes,
// head droops, eyes blink).
export function CatSvg() {
  return (
    <svg className={styles.svg} viewBox="0 0 84 60" width={84} height={60} aria-hidden="true">
      <g filter="url(#pencil2)" fill="var(--ink)" stroke="none" strokeLinecap="round" strokeLinejoin="round">
        <g className={styles.legs}>
          <path className={`${styles.leg} ${styles.legA}`} d={leg(25, 24.5)} />
          <path className={`${styles.leg} ${styles.legB}`} d={leg(31.5, 32)} />
          <path className={`${styles.leg} ${styles.legB}`} d={leg(50, 50)} />
          <path className={`${styles.leg} ${styles.legA}`} d={leg(55, 56.5)} />
        </g>

        <g className={styles.torso}>
          <path
            className={styles.tail}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={3}
            d="M22 33 C13 33, 9 40, 6 33 C3 26, 7 17, 13.5 15 C15.5 14.5, 16.5 16.5, 15 17.5"
          />
          <path d="M21 36 C19 28, 27 25, 34 27 C41 28.5, 47 28.5, 52 26 C58 23.5, 62 29, 60 36 C58.5 41, 54 43, 49 42 C43 41, 37 41.5, 31 43 C25 44, 22 41, 21 36 Z" />
          <ellipse cx={28} cy={37} rx={8} ry={7} />
          <path d="M50 28 C52 24, 54 21, 58 20 L63 27 C59 30, 58.5 33, 59 37 Z" />
          {/* faint pencil sheen so it reads as drawn, not a flat shape */}
          <path fill="none" stroke="var(--card)" strokeWidth={0.8} opacity={0.3} d="M31 29.6 q6 -1.3 11 -.2 M22.6 34 q2.6 -3.4 7 -3" />

          <g className={styles.head}>
            <path d="M56.5 16 C56.5 11, 57 7.5, 58 5 C60.5 7, 62.5 9.5, 63.5 12 Z" />
            <path d="M65 11.8 C67 8.5, 69 6, 71.5 4.5 C72 8, 72.3 12, 71.8 16 Z" />
            <path d="M55 22 C54.5 15, 59 11.5, 64.5 11.5 C70 11.5, 73.5 15.5, 73.5 20.5 C75.5 21.5, 75.5 24.5, 73 25.5 C70.5 28, 66 28.5, 62 28 C58.5 27.5, 55.5 26, 55 22 Z" />
            <path fill="none" stroke="var(--card)" strokeWidth={0.7} opacity={0.3} d="M58.4 8.5 L59.6 12.5 M70.4 8 L70.2 12.5" />

            <g className={styles.eyesOpen}>
              <circle cx={61} cy={20} r={2.6} fill="var(--card)" />
              <circle cx={68.4} cy={20} r={2.5} fill="var(--card)" />
              <g className={styles.pupils}>
                <circle cx={61.2} cy={20.2} r={2.05} />
                <circle cx={68.6} cy={20.2} r={2} />
              </g>
              {/* catch-lights */}
              <circle cx={60.4} cy={19.2} r={0.65} fill="var(--card)" />
              <circle cx={67.8} cy={19.2} r={0.6} fill="var(--card)" />
            </g>
            <path className={styles.eyesClosed} fill="none" stroke="var(--card)" strokeWidth={1} d="M58.6 20 q2.4 1.8 4.8 0 M66 20 q2.4 1.8 4.8 0" />
            <path className={styles.eyesHappy} fill="none" stroke="var(--card)" strokeWidth={1} d="M58.6 21 q2.4 -2.8 4.8 0 M66 21 q2.4 -2.8 4.8 0" />

            <circle cx={74.4} cy={23} r={0.75} fill="var(--accent)" />
            <path fill="none" stroke="var(--graphite)" strokeWidth={0.6} opacity={0.55} d="M72 24 L82 22.4 M72 25.2 L81.5 27" />
          </g>
        </g>
      </g>
    </svg>
  );
}
