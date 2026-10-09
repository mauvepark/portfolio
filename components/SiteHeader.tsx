'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { PencilRule } from './sketch/PencilFilters';
import styles from './SiteHeader.module.css';

const links = [
  ['about', 'About'],
  ['projects', 'Projects'],
  ['skills', 'Skills'],
  ['notes', 'Notes'],
  ['guestbook', 'Guestbook'],
  ['contact', 'Contact'],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Publish the header's height so anchor jumps land below it (html { scroll-padding-top }).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`));
    ro.observe(el);
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  function toTop(e: React.MouseEvent) {
    if (pathname !== '/') return; // elsewhere, the link just goes home
    e.preventDefault();
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
    history.replaceState(null, '', '/');
  }

  return (
    <div ref={ref} className={styles.bar} data-scrolled={scrolled}>
      <header className={styles.header}>
        <Link href="/" className={`hand ${styles.name}`} onClick={toTop}>Noor Ali</Link>
        <nav aria-label="Main" className={styles.nav}>
          {links.map(([id, label]) => (
            <Link key={id} className="navlink" href={`/#${id}`}>[{label}]</Link>
          ))}
        </nav>
      </header>
      <PencilRule />
    </div>
  );
}
