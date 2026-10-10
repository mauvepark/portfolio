import Image from 'next/image';
import { Hatch } from '@/components/sketch/PencilFilters';
import styles from './Cover.module.css';

/**
 * A project's cover: the image from its frontmatter (`image`) in a box of the given height,
 * or the hatched placeholder when there isn't one yet. Covers are pencil drawings on white,
 * so by default the whole drawing is fitted (`contain`) and the spare space blends into the
 * paper; set `imageFit: cover` for photos/screenshots that should crop to fill.
 */
export function Cover({ p, height, sizes, priority }: {
  p: { title: string; cover: string; image?: string; imageFit?: 'contain' | 'cover'; imageAlt?: string };
  height: number;
  sizes: string;
  priority?: boolean;
}) {
  if (!p.image) return <Hatch label={p.cover} height={height} />;
  return (
    <div className={styles.cover} style={{ height }}>
      <Image
        src={p.image}
        alt={p.imageAlt ?? `${p.title} cover`}
        fill
        sizes={sizes}
        priority={priority}
        style={{ objectFit: p.imageFit ?? 'contain' }}
      />
    </div>
  );
}
