'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CatSvg } from './CatSvg';
import { CAT_EVENT, readCatHidden, setCatHidden } from './catVisibility';
import styles from './Cat.module.css';

// A small graphite cat that lives along the bottom of the viewport. With a mouse it
// follows the cursor; on touch screens it wanders on its own. It loafs, then sleeps,
// when nothing happens, and purrs when clicked (five quick clicks and it bolts).
// Position runs in a rAF loop on refs; only pose changes re-render.

type Pose = 'sit' | 'walk' | 'loaf' | 'sleep' | 'pet' | 'startled' | 'run';

const W = 84;
const EDGE = 8;
const WALK_SPEED = 80; // px/s
const RUN_SPEED = 340;
const START_DIST = 120; // cursor this far from the cat → it gets up and follows
const STOP_DIST = 24;
const LOAF_AFTER = 8000;
const SLEEP_AFTER = 20000;
const WAKE_RADIUS = 140;
const SOUNDS = ['mrrp', 'prrr', 'mew?', 'purrr', 'mrow'];

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const maxX = () => window.innerWidth - W - EDGE;

export function Cat() {
  // Hidden until storage is read, so server and first client render agree (both null).
  const [hidden, setHidden] = useState(true);
  const [pose, setPoseState] = useState<Pose>('sit');
  const [bubble, setBubble] = useState<{ id: number; text: string } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const poseRef = useRef<Pose>('sit');
  const timers = useRef<number[]>([]);
  const st = useRef({
    x: 0,
    dir: 1,
    target: null as number | null,
    pointerX: null as number | null,
    pointerY: 0,
    lastActivity: 0,
    nextWander: 0,
    sulkUntil: 0,
    lastPet: 0,
    pets: [] as number[],
    reduced: false,
  });

  const setPose = useCallback((p: Pose) => {
    if (poseRef.current === p) return;
    poseRef.current = p;
    setPoseState(p);
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    setHidden(readCatHidden());
    const onVisibility = (e: Event) => setHidden((e as CustomEvent<{ hidden: boolean }>).detail.hidden);
    window.addEventListener(CAT_EVENT, onVisibility);
    return () => {
      window.removeEventListener(CAT_EVENT, onVisibility);
      timers.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (hidden || !root) return;
    const s = st.current;
    const canHover = window.matchMedia('(hover: hover)').matches;
    s.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    s.x = maxX() - 16;
    s.lastActivity = performance.now();
    s.nextWander = s.lastActivity + rand(6000, 12000);

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      s.pointerX = e.clientX;
      s.pointerY = e.clientY;
      const p = poseRef.current;
      if (p === 'sleep') {
        // Only a cursor that comes close wakes a sleeping cat.
        const d = Math.hypot(e.clientX - (s.x + W / 2), e.clientY - (window.innerHeight - 30));
        if (d > WAKE_RADIUS) return;
        setPose('sit');
      } else if (p === 'loaf') {
        setPose('sit');
      }
      s.lastActivity = performance.now();
    };
    const onResize = () => {
      s.x = clamp(s.x, EDGE, maxX());
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('resize', onResize);

    // rAF doesn't fire in background tabs, so the loop pauses itself there.
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const p = poseRef.current;

      if (!s.reduced) {
        // Desktop: follow the cursor once it's far enough away.
        if ((p === 'sit' || p === 'walk') && canHover && s.pointerX !== null && now > s.sulkUntil) {
          const d = s.pointerX - (s.x + W / 2);
          s.target = Math.abs(d) > (p === 'walk' ? STOP_DIST : START_DIST) ? s.pointerX - W / 2 : null;
        }
        // Touch: stroll somewhere every so often (sometimes it just keeps sleeping).
        if (!canHover && now > s.nextWander && (p === 'sit' || p === 'loaf' || p === 'sleep')) {
          if (p === 'sleep' && Math.random() < 0.5) {
            s.nextWander = now + rand(10000, 20000);
          } else {
            s.target = rand(EDGE, maxX());
            s.nextWander = Infinity;
          }
        }

        if (s.target !== null && (p === 'sit' || p === 'walk' || p === 'run' || p === 'loaf' || p === 'sleep')) {
          const goal = clamp(s.target, EDGE, maxX());
          const d = goal - s.x;
          if (Math.abs(d) <= 1) {
            s.x = goal;
            s.target = null;
          } else {
            s.dir = d > 0 ? 1 : -1;
            s.x += s.dir * Math.min(Math.abs(d), (p === 'run' ? RUN_SPEED : WALK_SPEED) * dt);
            if (p !== 'run') setPose('walk');
          }
          s.lastActivity = now;
        }
        if (s.target === null && (p === 'walk' || p === 'run')) {
          setPose('sit');
          s.lastActivity = now;
          if (!canHover) s.nextWander = now + rand(10000, 20000);
        }
      }

      const idle = now - s.lastActivity;
      if (p === 'sit' && idle > LOAF_AFTER) setPose('loaf');
      else if (p === 'loaf' && idle > SLEEP_AFTER) setPose('sleep');

      // Pupils glance toward the cursor (in the cat's own, possibly flipped, frame).
      if (s.pointerX !== null) {
        const lx = clamp((s.pointerX - (s.x + W * 0.75)) / 150, -1, 1) * 1.3 * s.dir;
        const ly = clamp((s.pointerY - (window.innerHeight - 40)) / 150, -1, 1);
        root.style.setProperty('--look-x', `${lx.toFixed(2)}px`);
        root.style.setProperty('--look-y', `${ly.toFixed(2)}px`);
      }
      root.style.setProperty('--dir', String(s.dir));
      root.style.transform = `translateX(${s.x.toFixed(1)}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', onResize);
    };
  }, [hidden, setPose]);

  const say = (text: string) => {
    const id = Date.now();
    setBubble({ id, text });
    later(() => setBubble((b) => (b?.id === id ? null : b)), 1700);
  };

  const onPet = () => {
    const s = st.current;
    const now = performance.now();
    s.pets = [...s.pets.filter((t) => now - t < 1500), now];
    s.lastActivity = now;
    s.lastPet = now;
    s.target = null;

    if (s.pets.length >= 5 && !s.reduced) {
      s.pets = [];
      setPose('startled');
      say('!!');
      later(() => {
        s.target = s.x + W / 2 < window.innerWidth / 2 ? maxX() : EDGE;
        s.sulkUntil = performance.now() + 5000;
        setPose('run');
      }, 380);
      return;
    }

    setPose('pet');
    say(SOUNDS[Math.floor(Math.random() * SOUNDS.length)]);
    later(() => {
      if (poseRef.current === 'pet' && performance.now() - s.lastPet >= 1500) setPose('sit');
    }, 1600);
  };

  if (hidden) return null;

  return (
    <div ref={rootRef} className={styles.cat} data-pose={pose}>
      {bubble && (
        <span key={bubble.id} className={styles.bubble} aria-hidden="true">
          <span className="sketch">{bubble.text}</span>
        </span>
      )}
      {bubble && pose === 'pet' && (
        <svg key={`heart-${bubble.id}`} className={styles.heart} viewBox="0 0 20 18" aria-hidden="true">
          <path
            d="M10 16 C3 11, 1 7, 3 4 C5 1, 9 2, 10 5 C11 2, 15 1, 17 4 C19 7, 17 11, 10 16 Z"
            fill="var(--accent)"
            filter="url(#pencil2)"
          />
        </svg>
      )}
      {pose === 'sleep' && (
        <span className={styles.zzz} aria-hidden="true">
          z z
        </span>
      )}
      <span className="sr-only" aria-live="polite">
        {bubble ? `The cat says ${bubble.text}` : ''}
      </span>
      <button type="button" className={styles.shoo} onClick={() => setCatHidden(true)}>
        [shoo]
      </button>
      <button type="button" className={styles.pet} aria-label="Pet the cat" onClick={onPet}>
        <span className={styles.flip}>
          <CatSvg />
        </span>
      </button>
    </div>
  );
}
