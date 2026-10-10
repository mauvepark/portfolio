'use client';

import { useEffect, useRef } from 'react';
import styles from './SketchDialog.module.css';

/**
 * A taped, pencil-outlined card over the page (native <dialog>: Esc, the backdrop or
 * [Close ×] dismiss it; focus is trapped while open and returned on close). Only the body
 * scrolls, so the outline, tape and Close stay put on long content.
 */
export function SketchDialog({ openKey, onClose, label, titleId, wide, children }: {
  /** Which item is open (e.g. its slug), or null when closed. */
  openKey: string | null;
  onClose: () => void;
  /** Small mono line top-left, e.g. "Product Specs · 2026-10-08". */
  label: React.ReactNode;
  /** id of the heading inside `children`, for aria-labelledby. */
  titleId: string;
  /** Wider card for case studies with tables and diagrams. */
  wide?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  // Keyed on *which* item is open, not just whether one is: opening a different item right
  // after closing another (before that close event has reached the parent) still shows it,
  // while unrelated re-renders never reopen a dialog the visitor just closed.
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (openKey !== null && !d.open) d.showModal();
    if (openKey === null && d.open) d.close();
  }, [openKey]);

  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${wide ? styles.wide : ''}`}
      // Our own close paths update the parent right away (the effect then closes the element),
      // rather than waiting on the native close event, which browsers can delay.
      // Esc: take over the browser's default close.
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      // Clicking the dimmed backdrop (the dialog element itself, outside the card).
      onClick={(e) => e.target === e.currentTarget && onClose()}
      // Backstop for any other close; ignore a late event if something was reopened meanwhile.
      onClose={(e) => !e.currentTarget.open && onClose()}
      aria-labelledby={titleId}
    >
      {openKey !== null && (
        <article className={`sketch ${styles.card}`}>
          <div className="tape" aria-hidden="true" />
          <header className={styles.cardHead}>
            <p className="label label-sm">{label}</p>
            <button type="button" className="navlink" aria-label="Close" onClick={onClose}
              style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)' }}>[Close ×]</button>
          </header>
          <div className={styles.scroll}>{children}</div>
        </article>
      )}
    </dialog>
  );
}
