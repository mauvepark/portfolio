import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { Prose } from '@/components/Prose';
import { getNote, getNotes } from '@/lib/content';

export function generateStaticParams() {
  return getNotes().map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const n = getNote((await params).slug);
  return n ? { title: `${n.title} — Noor Ali` } : {};
}

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const n = getNote((await params).slug);
  if (!n) notFound();

  return (
    <div className="wrap">
      <SiteHeader />
      <article style={{ padding: '56px 0 96px' }}>
        <Link className="navlink" href="/notes">[← All notes]</Link>
        <p className="label" style={{ marginTop: 24 }}>{n.date}</p>
        <h1 className="hand" style={{ fontSize: 'clamp(44px, 7vw, 64px)', fontWeight: 700, lineHeight: 1, margin: '8px 0 24px', maxWidth: 820 }}>{n.title}</h1>
        <Prose source={n.body} />
      </article>
    </div>
  );
}
