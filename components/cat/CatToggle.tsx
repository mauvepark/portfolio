'use client';

import { useEffect, useState } from 'react';
import { CAT_EVENT, readCatHidden, setCatHidden } from './catVisibility';
import styles from './Cat.module.css';

// Footer link that brings the cat back after someone shoos it. Only shown while it's gone.
export function CatToggle() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(readCatHidden());
    const onVisibility = (e: Event) => setHidden((e as CustomEvent<{ hidden: boolean }>).detail.hidden);
    window.addEventListener(CAT_EVENT, onVisibility);
    return () => window.removeEventListener(CAT_EVENT, onVisibility);
  }, []);

  if (!hidden) return null;
  return (
    <button
      type="button"
      onClick={() => setCatHidden(false)}
      className={styles.callBack}
    >
      [pspsps (call the cat)]
    </button>
  );
}
