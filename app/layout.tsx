import type { Metadata } from 'next';
import { Caveat, Karla, IBM_Plex_Mono } from 'next/font/google';
import { PencilFilters } from '@/components/sketch/PencilFilters';
import { site } from '@/lib/site';
import './globals.css';

const caveat = Caveat({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-caveat' });
const karla = Karla({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-karla' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono' });

// What link previews (LinkedIn, iMessage, Slack…), browser tabs and search results show.
const title = 'Noor Ali — Software Engineering Student & Aspiring PM';
const description =
  'Portfolio of Noor Ali, a software engineering student at the University of Calgary building toward product management. Case studies, product notes, and what I’m working on now.';

export const metadata: Metadata = {
  // Resolves relative URLs (e.g. the generated preview images) to the real domain.
  metadataBase: new URL(site.url),
  title,
  description,
  alternates: { canonical: '/' },
  openGraph: { type: 'website', siteName: 'Noor Ali — Portfolio', title, description, url: '/', locale: 'en_CA' },
  twitter: { card: 'summary_large_image', title, description },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${caveat.variable} ${karla.variable} ${plexMono.variable}`}>
      <body>
        <div className="paper">
          <PencilFilters />
          {children}
        </div>
      </body>
    </html>
  );
}
