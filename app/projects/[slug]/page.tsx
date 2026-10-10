import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { Prose } from '@/components/Prose';
import { Cover } from '@/components/projects/Cover';
import { getProject, getProjects } from '@/lib/content';

export function generateStaticParams() {
  return getProjects().filter((p) => !p.href).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProject((await params).slug);
  if (!p) return {};
  const title = `${p.title} — Noor Ali`;
  return {
    title,
    description: p.blurb,
    alternates: { canonical: `/projects/${p.slug}` },
    openGraph: { type: 'article', title, description: p.blurb, url: `/projects/${p.slug}` },
    twitter: { card: 'summary_large_image', title, description: p.blurb },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProject((await params).slug);
  if (!p || p.href) notFound();

  return (
    <div className="wrap">
      <SiteHeader />
      <article style={{ padding: '56px 0 96px' }}>
        <Link className="navlink" href="/#projects">[← All projects]</Link>
        <p className="label" style={{ marginTop: 24 }}>{p.kind}</p>
        <h1 className="section-title" style={{ fontSize: 'clamp(56px, 10vw, 88px)', margin: '8px 0 16px' }}>{p.title}</h1>
        <p className="lede">{p.blurb}</p>
        <p className="card-stack" style={{ margin: '16px 0 40px' }}>{p.stack}</p>
        <div className="sketch" style={{ background: 'var(--card)', padding: 16, maxWidth: 880 }}>
          <Cover p={p} height={360} sizes="(max-width: 960px) 100vw, 880px" priority />
        </div>
        <Prose source={p.body} />
      </article>
    </div>
  );
}
