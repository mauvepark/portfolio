import { ImageResponse } from 'next/og';
import { getProject, getProjects } from '@/lib/content';
import { Footer, muted, OG_SIZE, ogFonts, paperStyle, publicImage } from '@/lib/og';

export const alt = 'A project from Noor Ali’s portfolio';
export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateStaticParams() {
  return getProjects().filter((p) => !p.href).map((p) => ({ slug: p.slug }));
}

/** Link preview for a case study: its pencil cover on a sketchbook page, with the title. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProject((await params).slug);
  const [fonts, cover] = await Promise.all([ogFonts(), publicImage(p?.image)]);

  return new ImageResponse(
    (
      <div style={{ ...paperStyle, flexDirection: 'column', padding: '56px 72px 48px' }}>
        <div style={{ display: 'flex', fontFamily: 'Plex Mono', fontSize: 22, letterSpacing: 3, color: muted, textTransform: 'uppercase' }}>
          {p?.kind ?? 'Project'}
        </div>
        <div style={{ display: 'flex', fontFamily: 'Caveat', fontSize: 96, lineHeight: 1, margin: '10px 0 26px' }}>{p?.title ?? 'Noor Ali'}</div>

        {/* The cover as a page taped into the sketchbook; covers are drawings on white. */}
        <div style={{ display: 'flex', flex: 1, background: '#fff', border: '2px solid #2E2E2B', borderRadius: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 10px 24px rgba(0,0,0,.10)' }}>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" />
          ) : (
            <div style={{ display: 'flex', fontFamily: 'Karla', fontSize: 34, color: muted, padding: '0 60px', textAlign: 'center' }}>{p?.blurb}</div>
          )}
        </div>

        <div style={{ display: 'flex', marginTop: 22 }}>
          <Footer>noorali.me · case study</Footer>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
