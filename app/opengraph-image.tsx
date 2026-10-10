import { ImageResponse } from 'next/og';
import { accent, Footer, muted, OG_SIZE, ogFonts, paperStyle, publicImage } from '@/lib/og';

export const alt = 'Noor Ali — hi, I’m Noor. I build things and sketch the why.';
export const size = OG_SIZE;
export const contentType = 'image/png';

/** The link preview for the site: the intro as a sketchbook page, with the polaroid photo. */
export default async function Image() {
  const [fonts, photo] = await Promise.all([ogFonts(), publicImage('/me.jpg')]);

  return new ImageResponse(
    (
      <div style={{ ...paperStyle, alignItems: 'center', padding: '0 80px', gap: 72 }}>
        {/* Polaroid with tape */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', transform: 'rotate(-3deg)' }}>
          <div style={{ position: 'absolute', top: -18, width: 120, height: 34, background: 'rgba(214,208,192,.85)', transform: 'rotate(4deg)' }} />
          <div style={{ display: 'flex', background: '#FBFAF7', padding: '20px 20px 64px', border: '2px solid #2E2E2B', borderRadius: 6, boxShadow: '0 10px 24px rgba(0,0,0,.12)' }}>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} width={300} height={325} style={{ objectFit: 'cover' }} alt="" />
            ) : (
              <div style={{ width: 300, height: 325, background: '#ECE9E2' }} />
            )}
          </div>
        </div>

        {/* Intro */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'flex', fontFamily: 'Plex Mono', fontSize: 19, letterSpacing: 2, color: muted, textTransform: 'uppercase', marginBottom: 18, whiteSpace: 'nowrap' }}>
            Software engineering · Product · Design
          </div>
          {/* Three fixed lines, like the site's intro. */}
          <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'Caveat', fontSize: 90, lineHeight: 0.98, whiteSpace: 'nowrap' }}>
            <span>hi, I’m Noor.</span>
            <span style={{ color: accent }}>I build things</span>
            <span>and sketch the why.</span>
          </div>
          {/* pencil rule */}
          <div style={{ display: 'flex', height: 3, width: 420, background: '#2E2E2B', borderRadius: 2, margin: '34px 0 22px', opacity: 0.8 }} />
          <Footer>noorali.me · open to PM &amp; SWE internships</Footer>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
