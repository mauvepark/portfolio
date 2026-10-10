import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Shared pieces for the Open Graph (link preview) images. They render with Satori, which needs
// fonts as files (woff/ttf, not woff2) and images as data URIs, and only lays out flexbox.
export const OG_SIZE = { width: 1200, height: 630 };

export const ink = '#262624';
export const muted = '#55534E';
export const accent = '#A8432E';
export const paper = '#F3F1EC';

const font = (pkg: string, file: string) => readFile(path.join(process.cwd(), 'node_modules/@fontsource', pkg, 'files', file));

export async function ogFonts() {
  const [caveat, karla, mono] = await Promise.all([
    font('caveat', 'caveat-latin-700-normal.woff'),
    font('karla', 'karla-latin-500-normal.woff'),
    font('ibm-plex-mono', 'ibm-plex-mono-latin-400-normal.woff'),
  ]);
  return [
    { name: 'Caveat', data: caveat, weight: 700 as const, style: 'normal' as const },
    { name: 'Karla', data: karla, weight: 500 as const, style: 'normal' as const },
    { name: 'Plex Mono', data: mono, weight: 400 as const, style: 'normal' as const },
  ];
}

/**
 * A file from public/ as a data URI. Satori only draws PNG/JPEG, so other formats (webp) are
 * converted to PNG with sharp (which Next already depends on); null if that isn't possible.
 */
export async function publicImage(src: string | undefined): Promise<string | null> {
  if (!src) return null;
  const data = await readFile(path.join(process.cwd(), 'public', src)).catch(() => null);
  if (!data) return null;
  const ext = path.extname(src).toLowerCase();
  if (ext === '.png') return `data:image/png;base64,${data.toString('base64')}`;
  if (ext === '.jpg' || ext === '.jpeg') return `data:image/jpeg;base64,${data.toString('base64')}`;
  try {
    const sharp = (await import('sharp')).default;
    const png = await sharp(data).png().toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch {
    return null;
  }
}

/** Paper with the site's faint dot grid. */
export const paperStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  backgroundColor: paper,
  backgroundImage: 'radial-gradient(circle, rgba(38,38,36,.10) 1.4px, transparent 1.6px)',
  backgroundSize: '26px 26px',
  fontFamily: 'Karla',
  color: ink,
} as const;

/** The mono "[noorali.me]"-style footer label. */
export function Footer({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', fontFamily: 'Plex Mono', fontSize: 22, letterSpacing: 2, color: muted, textTransform: 'uppercase' }}>
      {children}
    </div>
  );
}
