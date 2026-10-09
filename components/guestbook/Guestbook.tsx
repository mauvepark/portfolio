'use client';

import { useEffect, useState } from 'react';
import { PAGE_SIZE, type Entry, type Stroke } from '@/lib/guestbook';
import { supabasePublic } from '@/lib/supabase';
import { DoodlePad } from './DoodlePad';
import { DoodleSvg } from './DoodleSvg';
import styles from './Guestbook.module.css';

type Status = { kind: 'idle' | 'sending' | 'sent' } | { kind: 'error'; message: string };

export function Guestbook({ initial }: { initial: Entry[] }) {
  const [entries, setEntries] = useState(initial);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [hasMore, setHasMore] = useState(initial.length === PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  // Live wall: an entry appears the moment it's approved (RLS only lets approved rows through).
  useEffect(() => {
    const channel = supabasePublic()
      .channel('guestbook-wall')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guestbook' }, (payload) => {
        const row = payload.new as Partial<Entry> & { approved?: boolean };
        if (!row?.id) return;
        if (row.approved === false) {
          setEntries((prev) => prev.filter((e) => e.id !== row.id));
          return;
        }
        const entry = row as Entry;
        setEntries((prev) => (prev.some((e) => e.id === entry.id) ? prev : [entry, ...prev]));
        setFreshIds((prev) => new Set(prev).add(entry.id));
      })
      .subscribe();
    return () => {
      supabasePublic().removeChannel(channel);
    };
  }, []);

  async function loadMore() {
    const last = entries[entries.length - 1];
    if (!last) return;
    setLoadingMore(true);
    const res = await fetch(`/api/guestbook?before=${encodeURIComponent(last.created_at)}`);
    const { entries: more = [] } = res.ok ? await res.json() : {};
    setEntries((prev) => [...prev, ...more.filter((m: Entry) => !prev.some((e) => e.id === m.id))]);
    setHasMore(more.length === PAGE_SIZE);
    setLoadingMore(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!strokes.length && !message.trim()) {
      setStatus({ kind: 'error', message: 'Draw something or leave a note first.' });
      return;
    }
    setStatus({ kind: 'sending' });
    const res = await fetch('/api/guestbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, message, doodle: strokes, website }),
    }).catch(() => null);
    if (res?.ok) {
      setStatus({ kind: 'sent' });
      setStrokes([]);
      setMessage('');
    } else {
      const err = res ? await res.json().catch(() => ({})) : {};
      setStatus({ kind: 'error', message: err.error ?? 'Couldn’t send that. Try again?' });
    }
  }

  return (
    <section id="guestbook" className="section">
      <div className="section-head">
        <h2 className="section-title">leave a doodle</h2>
        <p className="label">Guestbook · {entries.length ? `${entries.length}${hasMore ? '+' : ''} pinned` : 'be the first'}</p>
      </div>

      <div className={styles.layout}>
        <form className={`sketch ${styles.form}`} onSubmit={submit}>
          <DoodlePad strokes={strokes} onChange={setStrokes} />

          <label className={styles.field}>
            <span className="label label-sm">Your name</span>
            <input required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          <label className={styles.field}>
            <span className="label label-sm">A note (optional)</span>
            <textarea maxLength={280} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
            <span className={styles.count}>{message.length}/280</span>
          </label>
          {/* Honeypot: hidden from people, irresistible to bots. */}
          <label className={styles.honeypot} aria-hidden="true">
            Website <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
            <button className="btn sketch" type="submit" disabled={status.kind === 'sending'}>
              {status.kind === 'sending' ? '[Pinning…]' : '[Pin it to the wall]'}
            </button>
            <p role="status" aria-live="polite" className={styles.status} data-kind={status.kind}>
              {status.kind === 'sent' && 'Thanks! It’ll show up once I’ve had a look.'}
              {status.kind === 'error' && status.message}
            </p>
          </div>
        </form>

        <div>
          {entries.length === 0 ? (
            <p className="aside">The wall is empty. Your doodle could be first!</p>
          ) : (
            <ul className={styles.wall}>
              {entries.map((e, i) => (
                <li key={e.id} className={`${styles.note} ${freshIds.has(e.id) ? styles.fresh : ''}`} style={{ '--tilt': `${[-2, 1.5, -1, 2.2, -1.6, 0.8][i % 6]}deg` } as React.CSSProperties}>
                  <div className="tape" aria-hidden="true" />
                  {e.doodle.length > 0 && <DoodleSvg strokes={e.doodle} label={`Doodle by ${e.name}`} />}
                  {e.message && <p className={styles.message}>{e.message}</p>}
                  <p className={styles.by}>— {e.name}</p>
                </li>
              ))}
            </ul>
          )}
          {hasMore && (
            <button className="btn" type="button" onClick={loadMore} disabled={loadingMore} style={{ marginTop: 24 }}>
              {loadingMore ? '[Loading…]' : '[Show older doodles]'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
