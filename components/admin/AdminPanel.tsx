'use client';

import type { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { DoodleSvg } from '@/components/guestbook/DoodleSvg';
import type { Stroke } from '@/lib/guestbook';
import { supabaseAuth } from '@/lib/supabase-auth';
import styles from './AdminPanel.module.css';

type Row = { id: string; name: string; message: string; doodle: Stroke[]; approved: boolean; created_at: string };
type Tab = 'pending' | 'approved';

/** Guestbook moderation: magic-link sign-in, then approve / hide / delete entries. */
export function AdminPanel() {
  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = still checking

  useEffect(() => {
    const auth = supabaseAuth().auth;
    auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="section-head">
        <h1 className="section-title">guestbook admin</h1>
        {session && (
          <button type="button" className="navlink" onClick={() => supabaseAuth().auth.signOut()}
            style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'var(--ink)' }}>
            [Sign out]
          </button>
        )}
      </div>
      {session === undefined ? <p className="label">Checking sign-in…</p> : session ? <Moderation session={session} /> : <SignIn />}
    </section>
  );
}

function SignIn() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{ kind: 'idle' | 'sending' | 'sent' | 'error'; message?: string }>({ kind: 'idle' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: 'sending' });
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    const body = res ? await res.json().catch(() => ({})) : {};
    setStatus(res?.ok ? { kind: 'sent', message: body.message } : { kind: 'error', message: body.error ?? 'Something went wrong.' });
  }

  return (
    <form className={`sketch ${styles.signIn}`} onSubmit={submit}>
      <p className={styles.lead}>Sign in with a one-time link sent to the admin email.</p>
      <label className={styles.field}>
        <span className="label label-sm">Email</span>
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <button className="btn sketch" type="submit" disabled={status.kind === 'sending'} style={{ alignSelf: 'flex-start' }}>
        {status.kind === 'sending' ? '[Sending…]' : '[Email me a link]'}
      </button>
      {status.message && <p role="status" className={styles.status} data-kind={status.kind}>{status.message}</p>}
    </form>
  );
}

function Moderation({ session }: { session: Session }) {
  const [tab, setTab] = useState<Tab>('pending');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const api = useCallback(
    (init?: RequestInit, query = '') =>
      fetch(`/api/admin/guestbook${query}`, {
        ...init,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      }),
    [session.access_token],
  );

  const load = useCallback(async () => {
    setError(null);
    setRows(null);
    const res = await api(undefined, `?status=${tab}`).catch(() => null);
    const body = res ? await res.json().catch(() => ({})) : {};
    if (!res?.ok) {
      setError(body.error ?? 'Could not load entries.');
      setRows([]);
      return;
    }
    setRows(body.entries);
  }, [api, tab]);

  useEffect(() => { load(); }, [load]);

  async function act(row: Row, action: 'approve' | 'hide' | 'delete') {
    if (action === 'delete' && !confirm(`Delete ${row.name}'s entry for good? This can't be undone.`)) return;
    setBusy(row.id);
    const res = await api(
      action === 'delete'
        ? { method: 'DELETE', body: JSON.stringify({ id: row.id }) }
        : { method: 'PATCH', body: JSON.stringify({ id: row.id, approved: action === 'approve' }) },
    ).catch(() => null);
    setBusy(null);
    if (!res?.ok) {
      const body = res ? await res.json().catch(() => ({})) : {};
      setError(body.error ?? 'That didn’t work. Try again?');
      return;
    }
    // Every action moves the entry off the current tab.
    setRows((prev) => prev?.filter((r) => r.id !== row.id) ?? prev);
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <div role="tablist" aria-label="Entries" className={styles.tabs}>
          {(['pending', 'approved'] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className={styles.tab} onClick={() => setTab(t)}>
              [{t === 'pending' ? 'Pending' : 'On the wall'}]
            </button>
          ))}
        </div>
        <span className="label label-sm">Signed in as {session.user.email}</span>
        <button type="button" className="navlink" onClick={load} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'var(--ink)' }}>
          [Refresh]
        </button>
      </div>

      {error && <p role="alert" className={styles.status} data-kind="error">{error}</p>}
      {rows === null ? (
        <p className="label">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="aside">{tab === 'pending' ? 'Nothing waiting. All caught up!' : 'Nothing on the wall yet.'}</p>
      ) : (
        <ul className={styles.grid}>
          {rows.map((r) => (
            <li key={r.id} className={`sketch ${styles.card}`}>
              <div className={styles.doodle}>
                {r.doodle.length > 0 ? <DoodleSvg strokes={r.doodle} label={`Doodle by ${r.name}`} /> : <p className="label label-sm">No doodle</p>}
              </div>
              <p className={styles.name}>{r.name}</p>
              {r.message && <p className={styles.message}>{r.message}</p>}
              <p className="label label-sm">{new Date(r.created_at).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              <div className={styles.actions}>
                {tab === 'pending' ? (
                  <button type="button" className="btn sketch" disabled={busy === r.id} onClick={() => act(r, 'approve')}>[Approve]</button>
                ) : (
                  <button type="button" className="btn sketch" disabled={busy === r.id} onClick={() => act(r, 'hide')}>[Hide]</button>
                )}
                <button type="button" className={`btn ${styles.delete}`} disabled={busy === r.id} onClick={() => act(r, 'delete')}>[Delete]</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
