import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { getNotes } from '@/lib/content';

export const metadata = { title: 'Notes — Noor Ali' };

export default function NotesIndex() {
  return (
    <div className="wrap">
      <SiteHeader />
      <section className="section" style={{ paddingTop: 56 }}>
        <h1 className="section-title" style={{ marginBottom: 28 }}>notes</h1>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {getNotes().map((n) => (
            <Link key={n.slug} className="row" href={`/notes/${n.slug}`}>
              <span className="row-date">{n.date}</span>
              <span className="row-title">{n.title}</span>
              <span className="navlink" style={{ minHeight: 0 }}>[Read]</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
