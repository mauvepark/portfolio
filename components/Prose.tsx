import { MDXRemote } from 'next-mdx-remote/rsc';
import styles from './Prose.module.css';

export function Prose({ source }: { source: string }) {
  return (
    <div className={styles.prose}>
      <MDXRemote source={source} />
    </div>
  );
}
