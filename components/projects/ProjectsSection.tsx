'use client';

import { useEffect, useState } from 'react';
import type { ProjectSummary } from '@/lib/content';
import { ProjectGrid } from './ProjectGrid';
import { Sketchbook } from './Sketchbook';

type View = 'book' | 'grid';
const STORAGE_KEY = 'projects-view';

export function ProjectsSection({ projects, lead }: { projects: ProjectSummary[]; lead?: string }) {
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
        <button type="button" className="navlink" onClick={() => choose(view === 'book' ? 'grid' : 'book')}
          style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0, color: 'var(--ink)' }}>
          {view === 'book' ? '[View as grid]' : '[Open the sketchbook]'}
        </button>
      </div>
      {lead && <p className="lede" style={{ margin: '-12px 0 36px', maxWidth: 760 }}>{lead}</p>}
      {view === 'book' ? <Sketchbook projects={projects} /> : <ProjectGrid projects={projects} />}
    </section>
  );
}
