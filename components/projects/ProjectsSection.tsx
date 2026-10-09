'use client';

import { useEffect, useState } from 'react';
import type { ProjectSummary } from '@/lib/content';
import { ProjectGrid } from './ProjectGrid';
import { Sketchbook } from './Sketchbook';
import styles from './Sketchbook.module.css';

type View = 'book' | 'grid';
const STORAGE_KEY = 'projects-view';

export function ProjectsSection({ projects }: { projects: ProjectSummary[] }) {
  const [view, setView] = useState<View>('book');

  // Remember the visitor's choice (a convenience only; storage may be unavailable).
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'grid') setView('grid');
    } catch {}
  }, []);

  function choose(v: View) {
    setView(v);
    try { localStorage.setItem(STORAGE_KEY, v); } catch {}
  }

  return (
    <section id="projects" className="section">
      <div className="section-head">
        <h2 className="section-title">projects</h2>
        <button type="button" className={`navlink ${styles.viewToggle}`} onClick={() => choose(view === 'book' ? 'grid' : 'book')}
          style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0, color: 'var(--ink)' }}>
          {view === 'book' ? '[View as grid]' : '[Open the sketchbook]'}
        </button>
      </div>
      <div className={view === 'book' ? styles.bookOnly : styles.hidden}>
        <Sketchbook projects={projects} />
      </div>
      <div className={view === 'book' ? styles.gridFallback : undefined}>
        <ProjectGrid projects={projects} />
      </div>
    </section>
  );
}
