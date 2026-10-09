import Link from 'next/link';
import { PencilRule } from './sketch/PencilFilters';

export function SiteHeader() {
  return (
    <>
      <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '28px 0 16px' }}>
        <Link href="/#about" className="hand" style={{ fontSize: 40, fontWeight: 700, lineHeight: 1 }}>Noor Ali</Link>
        <nav aria-label="Main" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 22px' }}>
          <Link className="navlink" href="/#projects">[Projects]</Link>
          <Link className="navlink" href="/#skills">[Skills]</Link>
          <Link className="navlink" href="/#notes">[Notes]</Link>
          <Link className="navlink" href="/#guestbook">[Guestbook]</Link>
          <Link className="navlink" href="/#contact">[Contact]</Link>
        </nav>
      </header>
      <PencilRule />
    </>
  );
}
