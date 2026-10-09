import type { Metadata } from 'next';
import { Caveat, Karla, IBM_Plex_Mono } from 'next/font/google';
import { PencilFilters } from '@/components/sketch/PencilFilters';
import './globals.css';

const caveat = Caveat({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-caveat' });
const karla = Karla({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-karla' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono' });

export const metadata: Metadata = {
  title: 'Noor Ali — Portfolio',
  description: 'Noor Ali — software engineering student building toward product management. Projects, skills and notes.',
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
