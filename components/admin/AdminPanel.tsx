'use client';

import { useCallback, useEffect, useState } from 'react';
import { DoodleSvg } from '@/components/guestbook/DoodleSvg';
import type { Stroke } from '@/lib/guestbook';
import styles from './AdminPanel.module.css';

type Row = { id: string; name: string; message: string; doodle: Stroke[]; approved: boolean; created_at: string };
type Tab = 'pending' | 'approved';
type SessionState = { configured: boolean; signedIn: boolean } | null; // null = still checking

const linkButton = { background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'var(--ink)' } as const;

/** Guestbook moderation: username/password sign-in (session cookie), then approve / hide / delete. */
export function AdminPanel() {
  const [session, setSession] = useState<SessionState>(null);

  const check = useCallback(async () => {
    const res = await fetch('/api/admin/session', { cache: 'no-store' }).catch(() => null);
    setSession(res?.ok ? await res.json() : { configured: true, signedIn: false });
  }, []);

  useEffect(() => { check(); }, [check]);

  const expired = useCallback(() => setSession({ configured: true, signedIn: false }), []);

  async function signOut() {
    await fetch('/api/admin/session', { method: 'DELETE' }).catch(() => null);
    setSession((s) => (s ? { ...s, signedIn: false } : s));
  }

  return (
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="section-head">
        <h1 className="section-title">guestbook admin</h1>
        {session?.signedIn && <button type="button" className="navlink" onClick={signOut} style={linkButton}>[Sign out]</button>}
      </div>
      {session === null ? (
        <p className="label">Checking sign-in…</p>
      ) : !session.configured ? (
        <p className="lede">Admin isn&apos;t set up yet: add ADMIN_USERNAME and ADMIN_PASSWORD_HASH to the environment.</p>
      ) : session.signedIn ? (
        <Moderation onSignedOut={expired} />
      ) : (
        <SignIn onSignedIn={() => setSession({ configured: true, signedIn: true })} />
      )}
    </section>
  );
}

function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{ kind: 'idle' | 'sending' | 'error'; message?: string }>({ kind: 'idle' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: 'sending' });
    const res = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).catch(() => null);
    if (res?.ok) {
      setPassword('');
      onSignedIn();
      return;
    }
    const body = res ? await res.json().catch(() => ({})) : {};
    setStatus({ kind: 'error', message: body.error ?? 'Something went wrong.' });
  }

  return (
    <form className={`sketch ${styles.signIn}`} onSubmit={submit}>
      <label className={styles.field}>
        <span className="label label-sm">Username</span>
        <input required autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <label className={styles.field}>
        <span className="label label-sm">Password</span>
        <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <button className="btn sketch" type="submit" disabled={status.kind === 'sending'} style={{ alignSelf: 'flex-start' }}>
        {status.kind === 'sending' ? '[Signing in…]' : '[Sign in]'}
      </button>
      {status.message && <p role="alert" className={styles.status} data-kind={status.kind}>{status.message}</p>}
    </form>
  );
}

function Moderation({ onSignedOut }: { onSignedOut: () => void }) {
  const [tab, setTab] = useState<Tab>('pending');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const api = useCallback(
    (init?: RequestInit, query = '') =>
      fetch(`/api/admin/guestbook${query}`, {
        ...init,
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      }).then((res) => {
        if (res.status === 401) onSignedOut(); // session expired
        return res;
      }),
    [onSignedOut],
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
        <button type="button" className="navlink" onClick={load} style={linkButton}>
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
