'use client';

import { useEffect, useRef, useState } from 'react';
import { DOODLE_H, DOODLE_W, MAX_POINTS, MAX_STROKES, type Stroke } from '@/lib/guestbook';
import { strokeToPath } from './DoodleSvg';

const COLORS = ['var(--graphite)', 'var(--accent)'];

/** Ramer–Douglas–Peucker on a flat [x0,y0,x1,y1,…] array. */
function simplify(p: number[], epsilon = 1.2): number[] {
  if (p.length <= 4) return p;
  const n = p.length / 2;
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack: [number, number][] = [[0, n - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay, bx, by] = [p[a * 2], p[a * 2 + 1], p[b * 2], p[b * 2 + 1]];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let maxD = 0, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((by - ay) * p[i * 2] - (bx - ax) * p[i * 2 + 1] + bx * ay - by * ax) / len;
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > epsilon && idx > 0) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(p[i * 2], p[i * 2 + 1]);
  return out;
}

const pointCount = (strokes: Stroke[]) => strokes.reduce((n, s) => n + s.p.length / 2, 0);

const STROKE_W = 2.4; // in doodle units (the 320x240 box)

export function DoodlePad({ strokes, onChange }: { strokes: Stroke[]; onChange: (s: Stroke[]) => void }) {
  const padRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points = useRef<number[] | null>(null); // the stroke being drawn, in doodle units (unrounded)
  const [color, setColor] = useState<0 | 1>(0);
  const [drawing, setDrawing] = useState(false);
  const full = strokes.length >= MAX_STROKES || pointCount(strokes) >= MAX_POINTS;

  // iOS Safari ignores touch-action on <svg> and would start scrolling mid-stroke (leaving a dot),
  // so block touch scrolling on the wrapper directly. Needs a non-passive listener.
  useEffect(() => {
    const el = padRef.current;
    if (!el) return;
    const stop = (e: TouchEvent) => e.preventDefault();
    el.addEventListener('touchstart', stop, { passive: false });
    el.addEventListener('touchmove', stop, { passive: false });
    return () => {
      el.removeEventListener('touchstart', stop);
      el.removeEventListener('touchmove', stop);
    };
  }, []);

  // Keep the live-drawing canvas at the pad's size in device pixels, so lines stay crisp.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fit = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  function toPoint(e: { clientX: number; clientY: number }, r: DOMRect) {
    const x = ((e.clientX - r.left) / r.width) * DOODLE_W;
    const y = ((e.clientY - r.top) / r.height) * DOODLE_H;
    return [Math.min(DOODLE_W, Math.max(0, x)), Math.min(DOODLE_H, Math.max(0, y))];
  }

  /*
   * The live stroke is drawn on a canvas, one small segment per new point, so each move costs
   * the same however long the stroke is (re-rendering a growing SVG path each frame was choppy
   * on phones). Segments are quadratic curves through midpoints, matching strokeToPath, and the
   * finished stroke is handed to the SVG as usual on lift.
   */
  function ctx() {
    const canvas = canvasRef.current;
    const c = canvas?.getContext('2d');
    if (!canvas || !c) return null;
    const k = canvas.width / DOODLE_W; // doodle units → canvas pixels
    return { c, k, canvas };
  }

  function startInk(x: number, y: number) {
    const g = ctx();
    if (!g) return;
    const { c, k, canvas } = g;
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.strokeStyle = c.fillStyle = getComputedStyle(padRef.current!).getPropertyValue(color ? '--accent' : '--graphite').trim() || '#2E2E2B';
    c.lineWidth = STROKE_W * k;
    c.lineCap = c.lineJoin = 'round';
    c.beginPath();
    c.arc(x * k, y * k, (STROKE_W * k) / 2, 0, Math.PI * 2); // a dot until the finger moves
    c.fill();
  }

  /** Draw from the previous midpoint, curving through the previous point, to the new midpoint. */
  function inkSegment(pts: number[]) {
    const g = ctx();
    if (!g) return;
    const { c, k } = g;
    const n = pts.length / 2;
    const [ax, ay, bx, by] = n >= 3 ? pts.slice(-6, -2) : [pts[0], pts[1], pts[0], pts[1]];
    const [cx, cy] = pts.slice(-2);
    const startX = n >= 3 ? (ax + bx) / 2 : ax, startY = n >= 3 ? (ay + by) / 2 : ay;
    c.beginPath();
    c.moveTo(startX * k, startY * k);
    c.quadraticCurveTo(bx * k, by * k, ((bx + cx) / 2) * k, ((by + cy) / 2) * k);
    c.stroke();
  }

  function clearInk() {
    const g = ctx();
    g?.c.clearRect(0, 0, g.canvas.width, g.canvas.height);
  }

  function down(e: React.PointerEvent<HTMLDivElement>) {
    if (full || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    // Keep receiving moves if the finger strays off the pad; drawing still works if capture fails.
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    const [x, y] = toPoint(e, e.currentTarget.getBoundingClientRect());
    points.current = [x, y];
    setDrawing(true);
    startInk(x, y);
  }

  function move(e: React.PointerEvent<HTMLDivElement>) {
    const pts = points.current;
    if (!pts) return;
    const r = e.currentTarget.getBoundingClientRect();
    // Coalesced events carry every sample between frames, so fast strokes stay smooth.
    const samples = e.nativeEvent.getCoalescedEvents?.() ?? [];
    for (const ev of samples.length ? samples : [e.nativeEvent]) {
      const [x, y] = toPoint(ev, r);
      if (Math.hypot(x - pts[pts.length - 2], y - pts[pts.length - 1]) < 1.2) continue;
      pts.push(x, y);
      inkSegment(pts);
    }
  }

  function up() {
    const pts = points.current;
    if (!pts) return;
    points.current = null;
    setDrawing(false);
    onChange([...strokes, { c: color, p: simplify(pts.map(Math.round)) }]);
    clearInk(); // the SVG now draws the finished stroke
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        ref={padRef}
        className="sketch"
        role="img"
        aria-label="Drawing pad: draw with your mouse, finger or stylus"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        style={{
          background: '#fff', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none', cursor: full ? 'not-allowed' : 'crosshair',
        } as React.CSSProperties}
      >
        <svg viewBox={`0 0 ${DOODLE_W} ${DOODLE_H}`} aria-hidden="true" style={{ display: 'block', width: '100%', height: 'auto', pointerEvents: 'none' }}>
          <g fill="none" strokeWidth={STROKE_W} strokeLinecap="round" strokeLinejoin="round">
            {strokes.map((s, i) => <path key={i} d={strokeToPath(s.p)} stroke={COLORS[s.c]} />)}
          </g>
        </svg>
        {/* Live ink on its own compositor layer, so drawing never repaints the filtered pencil border. */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', willChange: 'transform' }}
        />
        {strokes.length === 0 && !drawing && (
          <span className="aside" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none', opacity: 0.45 }}>
            doodle something here ✎
          </span>
        )}
      </div>
      <div className="btn-row" style={{ gap: 8 }} role="group" aria-label="Drawing tools">
        <button type="button" className="btn" aria-pressed={color === 0} onClick={() => setColor(0)} style={color === 0 ? { textDecoration: 'underline' } : undefined}>[Graphite]</button>
        <button type="button" className="btn" aria-pressed={color === 1} onClick={() => setColor(1)} style={{ color: 'var(--accent)', ...(color === 1 ? { textDecoration: 'underline' } : {}) }}>[Red]</button>
        <button type="button" className="btn" disabled={!strokes.length} onClick={() => onChange(strokes.slice(0, -1))}>[Undo]</button>
        <button type="button" className="btn" disabled={!strokes.length} onClick={() => onChange([])}>[Clear]</button>
      </div>
      {full && <p className="label label-sm" role="status">That’s a full page. Undo a stroke to keep drawing.</p>}
    </div>
  );
}
