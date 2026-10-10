import type { Metadata } from 'next';
import { Caveat, Karla, IBM_Plex_Mono } from 'next/font/google';
import { PencilFilters } from '@/components/sketch/PencilFilters';
import { site } from '@/lib/site';
import './globals.css';

const caveat = Caveat({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-caveat' });
const karla = Karla({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-karla' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono' });

const description = 'Noor Ali — software engineering student with a background in biological sciences and a growing focus in product management.';

export const metadata: Metadata = {
  // Resolves relative URLs (e.g. the generated preview images) to the real domain.
  metadataBase: new URL(site.url),
  title: 'Noor Ali — Portfolio',
  description,
  alternates: { canonical: '/' },
  openGraph: { type: 'website', siteName: 'Noor Ali', title: 'Noor Ali — Portfolio', description, url: '/', locale: 'en_CA' },
  twitter: { card: 'summary_large_image', title: 'Noor Ali — Portfolio', description },
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
