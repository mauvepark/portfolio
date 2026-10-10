'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ProjectSummary } from '@/lib/content';
import { SketchDialog } from '@/components/sketch/SketchDialog';
import { Cover } from './Cover';
import { ProjectGrid } from './ProjectGrid';
import { Sketchbook } from './Sketchbook';
import styles from './ProjectsSection.module.css';

type View = 'book' | 'grid';
const STORAGE_KEY = 'projects-view';
const HASH = '#project-';

/**
 * Projects as a sketchbook (or grid). "Read case study" opens the project as a card over the
 * homepage; case-study bodies are rendered on the server and passed in. /#project-<slug> links
 * straight to a card; /projects/<slug> pages still exist for older links.
 */
export function ProjectsSection({ projects, bodies }: { projects: ProjectSummary[]; bodies: Record<string, React.ReactNode> }) {
  const [view, setView] = useState<View>('book');
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const open = projects.find((p) => p.slug === openSlug);

  // Remember the visitor's choice (a convenience only; storage may be unavailable).
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'grid') setView('grid');
    } catch {}
  }, []);

  // Deep link: /#project-<slug> opens that project's card on load.
  useEffect(() => {
    const slug = location.hash.startsWith(HASH) ? location.hash.slice(HASH.length) : null;
    if (slug && projects.some((p) => p.slug === slug)) setOpenSlug(slug);
  }, [projects]);

  function choose(v: View) {
    setView(v);
    try { localStorage.setItem(STORAGE_KEY, v); } catch {}
  }

  const show = useCallback((slug: string) => {
    setOpenSlug(slug);
    history.replaceState(null, '', HASH + slug);
  }, []);

  function onClose() {
    setOpenSlug(null);
    if (location.hash.startsWith(HASH)) history.replaceState(null, '', '#projects');
  }

  return (
    <section id="projects" className="section">
      <div className="section-head">
        <h2 className="section-title">projects</h2>
        <button type="button" className="navlink" onClick={() => choose(view === 'book' ? 'grid' : 'book')}
          style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0, color: 'var(--ink)' }}>
          {view === 'book' ? '[View as grid]' : '[Open the sketchbook]'}
        </button>
      </div>
      {view === 'book' ? <Sketchbook projects={projects} onOpen={show} /> : <ProjectGrid projects={projects} onOpen={show} />}

      <SketchDialog openKey={open ? open.slug : null} onClose={onClose} titleId="project-dialog-title" label={open?.kind} wide>
        {open && (
          <>
            <h3 id="project-dialog-title" className={styles.title}>{open.title}</h3>
            <p className={styles.stack}>{open.stack}</p>
            <div className={styles.cover}>
              <Cover p={open} height={280} sizes="(max-width: 1040px) 100vw, 980px" />
            </div>
            {bodies[open.slug]}
          </>
        )}
      </SketchDialog>
    </section>
  );
}
