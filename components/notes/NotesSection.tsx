'use client';

import { useCallback, useEffect, useState } from 'react';
import { SketchDialog } from '@/components/sketch/SketchDialog';
import styles from './NotesSection.module.css';

type NoteMeta = { slug: string; title: string; date: string; category?: string; tldr?: string };

const PREVIEW = 4;
const HASH = '#note-';

/** Notes list; each note opens as a card over the homepage. Bodies are rendered on the server. */
export function NotesSection({ notes, bodies }: { notes: NoteMeta[]; bodies: Record<string, React.ReactNode> }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const open = notes.find((n) => n.slug === openSlug);

  const show = useCallback((slug: string) => {
    setOpenSlug(slug);
    history.replaceState(null, '', HASH + slug);
  }, []);

  // Deep link: /#note-<slug> opens that note on load.
  useEffect(() => {
    const slug = location.hash.startsWith(HASH) ? location.hash.slice(HASH.length) : null;
    if (slug && notes.some((n) => n.slug === slug)) {
      setOpenSlug(slug);
      setShowAll(true);
    }
  }, [notes]);

  function onClose() {
    setOpenSlug(null);
    if (location.hash.startsWith(HASH)) history.replaceState(null, '', '#notes');
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
              <span className={`row-title ${styles.rowTitle}`}>
                {n.title}
                {n.tldr && <span className={styles.rowTldr}>{n.tldr}</span>}
              </span>
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

      <SketchDialog
        openKey={open ? open.slug : null}
        onClose={onClose}
        titleId="note-dialog-title"
        label={open ? [open.category, open.date].filter(Boolean).join(' · ') : null}
      >
        {open && (
          <>
            <h3 id="note-dialog-title" className={styles.title}>{open.title}</h3>
            {open.tldr && <p className={styles.tldr}><strong>TL;DR</strong> {open.tldr}</p>}
            {bodies[open.slug]}
          </>
        )}
      </SketchDialog>
    </section>
  );
}
