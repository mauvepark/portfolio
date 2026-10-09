import Link from 'next/link';
import { Hatch } from '@/components/sketch/PencilFilters';
import type { ProjectSummary } from '@/lib/content';

export function ProjectGrid({ projects }: { projects: ProjectSummary[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px 32px' }}>
      {projects.map((p) => (
        <article key={p.slug} className="card sketch">
          <Hatch label={p.cover} height={180} />
          <p className="label label-sm">{p.kind}</p>
          <h3>{p.title}</h3>
          <p className="card-blurb">{p.blurb}</p>
          <p className="card-stack">{p.stack}</p>
          <Link className="navlink" href={p.link}>[{p.cta} →]</Link>
        </article>
      ))}
    </div>
  );
}
