'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Cover } from './Cover';
import { DrawnUnderline } from '@/components/sketch/DrawnUnderline';
import type { ProjectSummary } from '@/lib/content';
import styles from './Sketchbook.module.css';

type Turn = { from: number; to: number; dir: 'next' | 'prev' };

const TURN_MS = 750;
const pad = (n: number) => String(n).padStart(2, '0');

function LeftPage({ p, i, live }: { p: ProjectSummary; i: number; live?: boolean }) {
  return (
    <div className={`${styles.page} ${styles.left}`}>
      <div className={styles.cover}>
        <Cover p={p} height={220} sizes="(max-width: 1120px) 45vw, 480px" />
      </div>
      <p className="label label-sm">{p.kind}</p>
      <h3 className={styles.title}>{p.title}</h3>
      {/* Keyed by page so the stroke replays on every turn. */}
      {live && <DrawnUnderline key={p.slug} width="min(260px, 80%)" delay={TURN_MS * 0.4} />}
      <span className={styles.folio}>p. {pad(i * 2 + 1)}</span>
    </div>
  );
}

function RightPage({ p, i, live, onOpen }: { p: ProjectSummary; i: number; live?: boolean; onOpen?: (slug: string) => void }) {
  return (
    <div className={`${styles.page} ${styles.right}`}>
      <p className={styles.blurb}>{p.blurb}</p>
      <div>
        <p className="label label-sm" style={{ marginBottom: 6 }}>Built with</p>
        <p className={styles.stack}>{p.stack}</p>
      </div>
      {live ? (
        <button type="button" className="btn sketch" onClick={() => onOpen?.(p.slug)} aria-haspopup="dialog" style={{ alignSelf: 'flex-start' }}>[{p.cta} →]</button>
      ) : (
        // Copy shown on the turning leaf: same look, but no SVG filter to re-run every frame.
        <span className={`btn ${styles.ghostBtn}`} style={{ alignSelf: 'flex-start' }}>[{p.cta} →]</span>
      )}
      <span className={styles.folio}>p. {pad(i * 2 + 2)}</span>
    </div>
  );
}

/** Narrow screens: one page per project, everything on it. */
function SinglePage({ p, i, live, onOpen }: { p: ProjectSummary; i: number; live?: boolean; onOpen?: (slug: string) => void }) {
  return (
    <div className={`${styles.page} ${styles.singlePage}`}>
      <Cover p={p} height={160} sizes="100vw" />
      <p className="label label-sm">{p.kind}</p>
      <h3 className={styles.title}>{p.title}</h3>
      {live && <DrawnUnderline key={p.slug} width="min(220px, 70%)" delay={TURN_MS * 0.4} />}
      <p className={styles.blurb}>{p.blurb}</p>
      <p className={styles.stack}>{p.stack}</p>
      {live ? (
        <button type="button" className="btn sketch" onClick={() => onOpen?.(p.slug)} aria-haspopup="dialog" style={{ alignSelf: 'flex-start' }}>[{p.cta} →]</button>
      ) : (
        <span className={`btn ${styles.ghostBtn}`} style={{ alignSelf: 'flex-start' }}>[{p.cta} →]</span>
      )}
      <span className={styles.folio}>p. {pad(i + 1)}</span>
    </div>
  );
}

export function Sketchbook({ projects, onOpen }: { projects: ProjectSummary[]; onOpen: (slug: string) => void }) {
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState<Turn | null>(null);
  const reducedMotion = useRef(false);
  const swipeStart = useRef<number | null>(null);
  const tabsRef = useRef<HTMLElement>(null);
  const n = projects.length;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion.current = mq.matches;
    const onChange = (e: MediaQueryListEvent) => (reducedMotion.current = e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const goTo = useCallback(
    (to: number) => {
      if (turn || to === index || to < 0 || to >= n) return;
      if (reducedMotion.current) return setIndex(to);
      setTurn({ from: index, to, dir: to > index ? 'next' : 'prev' });
    },
    [turn, index, n],
  );

  // Backstop: if animationend never arrives (resized across the breakpoint mid-turn, so the
  // animating leaf was hidden), still land on the target page shortly after the turn should end.
  useEffect(() => {
    if (!turn) return;
    const t = setTimeout(() => {
      setIndex(turn.to);
      setTurn(null);
    }, TURN_MS + 200);
    return () => clearTimeout(t);
  }, [turn]);

  function finishTurn(e: React.AnimationEvent) {
    // Ignore the shading animation on the faces bubbling up; only the leaf's own turn counts.
    if (!turn || e.target !== e.currentTarget) return;
    setIndex(turn.to);
    setTurn(null);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType !== 'mouse') swipeStart.current = e.clientX;
  }
  function onPointerUp(e: React.PointerEvent) {
    if (swipeStart.current === null) return;
    const dx = e.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(dx) > 50) goTo(index + (dx < 0 ? 1 : -1));
  }

  // Keep the current project's tab in view when the tab strip has to scroll (narrow screens).
  const target = turn ? turn.to : index;
  useEffect(() => {
    const strip = tabsRef.current;
    const tab = strip?.children[target] as HTMLElement | undefined;
    if (!strip || !tab || strip.scrollWidth <= strip.clientWidth) return;
    strip.scrollTo({ left: tab.offsetLeft - (strip.clientWidth - tab.offsetWidth) / 2, behavior: reducedMotion.current ? 'auto' : 'smooth' });
  }, [target]);

  // While a leaf is turning, the static pages show whatever the leaf will reveal / land on.
  const leftIdx = turn ? (turn.dir === 'next' ? turn.from : turn.to) : index;
  const rightIdx = turn ? (turn.dir === 'next' ? turn.to : turn.from) : index;
  const shown = target;

  return (
    <div
      className={styles.book}
      role="region"
      aria-roledescription="sketchbook"
      aria-label="Projects sketchbook. Use the left and right arrow keys to turn pages."
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <nav ref={tabsRef} className={styles.tabs} aria-label="Jump to project">
        {projects.map((p, i) => (
          <button
            key={p.slug}
            type="button"
            className={styles.tab}
            aria-current={i === shown ? 'page' : undefined}
            onClick={() => goTo(i)}
            style={{ '--tab-tilt': `${[-1.5, 1, -0.5, 1.5, -1, 0.5][i % 6]}deg` } as React.CSSProperties}
          >
            {p.title}
          </button>
        ))}
      </nav>

      <div className={styles.spread}>
        <LeftPage p={projects[leftIdx]} i={leftIdx} live={!turn} />
        <RightPage p={projects[rightIdx]} i={rightIdx} live={!turn} onOpen={onOpen} />

        {turn && (
          <div
            className={`${styles.leaf} ${turn.dir === 'next' ? styles.leafNext : styles.leafPrev}`}
            style={{ animationDuration: `${TURN_MS}ms`, '--turn-ms': `${TURN_MS}ms` } as React.CSSProperties}
            onAnimationEnd={finishTurn}
            aria-hidden="true"
          >
            <div className={styles.face}>
              {turn.dir === 'next' ? <RightPage p={projects[turn.from]} i={turn.from} /> : <LeftPage p={projects[turn.from]} i={turn.from} />}
            </div>
            <div className={`${styles.face} ${styles.back}`}>
              {turn.dir === 'next' ? <LeftPage p={projects[turn.to]} i={turn.to} /> : <RightPage p={projects[turn.to]} i={turn.to} />}
            </div>
          </div>
        )}
      </div>

      {/* Narrow screens: a top-bound sketch pad. "Next" flips the current page up and over the top;
          "Prev" brings the earlier page back down. Hidden leaves never animate, so only the
          visible layout's animationend finishes the turn. */}
      <div className={styles.pad}>
        <SinglePage p={projects[turn ? (turn.dir === 'next' ? turn.to : turn.from) : index]} i={turn ? (turn.dir === 'next' ? turn.to : turn.from) : index} live={!turn} onOpen={onOpen} />
        {turn && (
          <div
            className={`${styles.leaf} ${styles.leafPad} ${turn.dir === 'next' ? styles.flipUp : styles.flipDown}`}
            style={{ animationDuration: `${TURN_MS}ms`, '--turn-ms': `${TURN_MS}ms` } as React.CSSProperties}
            onAnimationEnd={finishTurn}
            aria-hidden="true"
          >
            <div className={styles.face}>
              <SinglePage p={projects[turn.dir === 'next' ? turn.from : turn.to]} i={turn.dir === 'next' ? turn.from : turn.to} />
            </div>
            <div className={`${styles.face} ${styles.padBack}`} />
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <button type="button" className="btn" onClick={() => goTo(index - 1)} disabled={index === 0 || !!turn}>[← Prev]</button>
        <span className="label" aria-hidden="true">{pad(shown + 1)} / {pad(n)}</span>
        <button type="button" className="btn" onClick={() => goTo(index + 1)} disabled={index === n - 1 || !!turn}>[Next →]</button>
      </div>

      <p className="sr-only" aria-live="polite">
        Project {shown + 1} of {n}: {projects[shown].title}
      </p>
    </div>
  );
}
