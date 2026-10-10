import Image from 'next/image';
import { Hatch } from '@/components/sketch/PencilFilters';
import styles from './Cover.module.css';

/**
 * A project's cover: the image from its frontmatter (`image`), cropped to fill a box of the
 * given height, or the hatched placeholder when there isn't one yet. Covers are drawn at
 * 1600x800 with the subject in the middle ~70%, so every slot's crop keeps it.
 */
export function Cover({ p, height, sizes, priority }: {
  p: { title: string; cover: string; image?: string };
  height: number;
  sizes: string;
  priority?: boolean;
}) {
  if (!p.image) return <Hatch label={p.cover} height={height} />;
  return (
    <div className={styles.cover} style={{ height }}>
      <Image
        src={p.image}
        alt={`${p.title} cover`}
        fill
        sizes={sizes}
        priority={priority}
        style={{ objectFit: 'cover' }}
      />
    </div>
  );
}
