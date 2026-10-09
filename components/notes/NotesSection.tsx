'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './NotesSection.module.css';

type NoteMeta = { slug: string; title: string; date: string };

const PREVIEW = 4;
const hashFor = (slug: string) => `#note-${slug}`;

/**
 * Notes list that opens each note as a card over the homepage (native <dialog>: Esc closes,
 * focus is trapped and returned). Bodies are rendered on the server and passed in.
 */
export function NotesSection({ notes, bodies }: { notes: NoteMeta[]; bodies: Record<string, React.ReactNode> }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const open = notes.find((n) => n.slug === openSlug);

  const show = useCallback((slug: string) => {
    setOpenSlug(slug);
    history.replaceState(null, '', hashFor(slug));
  }, []);

  // Open the dialog once its content is rendered.
  useEffect(() => {
    const d = dialogRef.current;
    if (openSlug && d && !d.open) d.showModal();
  }, [openSlug]);

  // Deep link: /#note-<slug> opens that note on load.
  useEffect(() => {
    const slug = location.hash.startsWith('#note-') ? location.hash.slice(6) : null;
    if (slug && notes.some((n) => n.slug === slug)) {
      setOpenSlug(slug);
      setShowAll(true);
    }
  }, [notes]);

  function onClose() {
    setOpenSlug(null);
    if (location.hash.startsWith('#note-')) history.replaceState(null, '', '#notes');
  }

  // Clicking the dimmed backdrop (the dialog element itself, outside the card) closes it.
  function onDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) e.currentTarget.close();
  }

  const visible = showAll ? notes : notes.slice(0, PREVIEW);

  return (
    <section id="notes" className="section">
      <div className="section-head" style={{ marginBottom: 28 }}>
        <h2 className="section-title">notes</h2>
        <p className="label">{notes.length} {notes.length === 1 ? 'entry' : 'entries'}</p>
      </div>

      <ul className={styles.list}>
        {visible.map((n) => (
          <li key={n.slug}>
            <button type="button" className={`row ${styles.row}`} onClick={() => show(n.slug)} aria-haspopup="dialog">
              <span className="row-date">{n.date}</span>
              <span className="row-title">{n.title}</span>
              <span className="navlink" style={{ minHeight: 0 }}>[Read]</span>
            </button>
          </li>
        ))}
      </ul>
      {notes.length > PREVIEW && (
        <button type="button" className="navlink" onClick={() => setShowAll((v) => !v)} style={{ background: 'none', border: 0, cursor: 'pointer', marginTop: 12, color: 'var(--ink)', padding: 0 }}>
          {showAll ? '[Show fewer]' : `[Show all ${notes.length}]`}
        </button>
      )}

      <dialog ref={dialogRef} className={styles.dialog} onClose={onClose} onClick={onDialogClick} aria-labelledby="note-dialog-title">
        {open && (
          <article className={`sketch ${styles.card}`}>
            <div className="tape" aria-hidden="true" />
            <header className={styles.cardHead}>
              <p className="label label-sm">{open.date}</p>
              <form method="dialog">
                <button className="navlink" aria-label="Close note" style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)' }}>[Close ×]</button>
              </form>
            </header>
            <div className={styles.scroll}>
              <h3 id="note-dialog-title" className={styles.title}>{open.title}</h3>
              {bodies[open.slug]}
            </div>
          </article>
        )}
      </dialog>
    </section>
  );
}
