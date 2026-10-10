import { Cover } from './Cover';
import type { ProjectSummary } from '@/lib/content';

export function ProjectGrid({ projects, onOpen }: { projects: ProjectSummary[]; onOpen: (slug: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px 32px' }}>
      {projects.map((p) => (
        <article key={p.slug} className="card sketch">
          <Cover p={p} height={180} sizes="(max-width: 700px) 100vw, 360px" />
          <p className="label label-sm">{p.kind}</p>
          <h3>{p.title}</h3>
          <p className="card-blurb">{p.blurb}</p>
          <p className="card-stack">{p.stack}</p>
          <button type="button" className="navlink" onClick={() => onOpen(p.slug)} aria-haspopup="dialog"
            style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'var(--ink)' }}>[{p.cta} →]</button>
        </article>
      ))}
    </div>
  );
}
