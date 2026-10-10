import now from '@/content/now.json';
import { getGithubActivity } from '@/lib/github';
import { site } from '@/lib/site';
import { getCurrentBook } from '@/lib/hardcover';
import styles from './Workbench.module.css';

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const daysAgo = Math.round(hours / 24);
  return daysAgo < 30 ? `${daysAgo}d ago` : new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

/** "2026-06-03" → "Jun 3" (UTC, so the day can't shift with the server's timezone). */
function shortDate(iso: string) {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** A closed book in pencil: cover, spine, page edges and a red bookmark ribbon. */
function BookSketch() {
  return (
    <svg className={styles.book} viewBox="0 0 120 150" aria-hidden="true">
      <g fill="none" stroke="var(--graphite)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#pencil2)">
        <path d="M22 14 L94 10 Q100 10 100 16 L104 128 Q104 134 98 134 L26 138 Q20 138 20 132 Z" fill="var(--card)" />
        <path d="M34 13 L38 137" />
        <path d="M100 18 L108 22 L112 132 L104 134" />
        <path d="M104 26 L109 28 M104.5 40 L109.5 42 M105 54 L110 56 M105.5 68 L110.5 70 M106 82 L111 84 M106.5 96 L111.5 98 M107 110 L112 112" strokeWidth="1.2" opacity=".55" />
        <path d="M50 44 L86 42 M52 56 L80 55" strokeWidth="1.8" opacity=".7" />
      </g>
      <path d="M78 8 L78 40 L84 34 L90 40 L90 8" fill="var(--accent)" stroke="none" opacity=".9" />
    </svg>
  );
}

/** A push pin seen from above: red head, small highlight, soft shadow on the paper. */
function Pin() {
  return (
    <svg className={styles.pin} viewBox="0 0 28 28" aria-hidden="true">
      <ellipse cx="16.5" cy="17.5" rx="9" ry="8" fill="rgba(38,38,36,.22)" />
      <circle cx="13" cy="13" r="9" fill="var(--accent)" />
      <circle cx="13" cy="13" r="9" fill="none" stroke="rgba(38,38,36,.35)" strokeWidth="1" />
      <circle cx="13" cy="13" r="5" fill="rgba(0,0,0,.12)" />
      <ellipse cx="10.4" cy="9.8" rx="2.6" ry="1.8" fill="rgba(255,255,255,.55)" transform="rotate(-35 10.4 9.8)" />
    </svg>
  );
}

/** "On my desk": what I'm building now, plus live GitHub activity. GitHub notes hide if the API is unavailable. */
export async function Workbench() {
  const [gh, book] = await Promise.all([getGithubActivity(), getCurrentBook()]);
  const sources = [gh && 'GitHub', book && 'Hardcover'].filter(Boolean).join(' & ');
  const placeholder = (s: string) => s.startsWith('[');

  return (
    <section id="workbench" className="section" aria-labelledby="workbench-title">
      <div className="section-head">
        <h2 id="workbench-title" className="section-title">on my desk</h2>
        <p className="label">{sources ? `Live from ${sources}` : `Updated ${now.updated}`}</p>
      </div>

      {/* A pencil-drawn corkboard; each note hangs from a push pin. */}
      <div className={`sketch ${styles.board}`}>
      <ul className={styles.desk}>
        <li className={styles.note} style={{ '--tilt': '-1.6deg' } as React.CSSProperties}>
          <Pin />
          <p className="label label-sm">Currently building</p>
          <p className={styles.big}>{now.building}</p>
          {!placeholder(now.learning) && (
            <>
              <p className="label label-sm" style={{ marginTop: 14 }}>Learning</p>
              <p className={styles.body}>{now.learning}</p>
            </>
          )}
        </li>

        {gh && gh.repos.length > 0 && (
          <li className={styles.note} style={{ '--tilt': '-0.8deg' } as React.CSSProperties}>
            <Pin />
            <p className="label label-sm">Last pushed</p>
            <ul className={styles.repos}>
              {gh.repos.map((r) => (
                <li key={r.name}>
                  <p className={styles.repoHead}>
                    <a href={r.url}>{r.name}</a>
                    <span>{timeAgo(r.pushedAt)}</span>
                  </p>
                  {r.lastCommit && (
                    <a className={styles.commit} href={r.lastCommit.url}>“{r.lastCommit.message}”</a>
                  )}
                </li>
              ))}
            </ul>
            <a className="navlink" href={site.links.github}>[More on GitHub →]</a>
          </li>
        )}

        {book && (
          <li className={styles.note} style={{ '--tilt': '1.2deg' } as React.CSSProperties}>
            <Pin />
            <p className="label label-sm">Currently reading</p>
            <div className={styles.reading}>
              <BookSketch />
              <div>
                <a className={styles.bookTitle} href={book.url}>{book.title}</a>
                {book.authors.length > 0 && <p className={styles.body}>by {book.authors.join(', ')}</p>}
                {book.genres.length > 0 && (
                  <ul className={styles.genres} aria-label="Genre">
                    {book.genres.map((g) => <li key={g}>{g}</li>)}
                  </ul>
                )}
              </div>
            </div>
            {book.percent !== null && (
              <>
                <div className={`sketch ${styles.progress}`} role="progressbar" aria-label={`Reading progress for ${book.title}`}
                  aria-valuemin={0} aria-valuemax={100} aria-valuenow={book.percent}>
                  <span style={{ width: `${book.percent}%` }} />
                </div>
                <p className={styles.caption}>
                  {book.pagesRead !== null && book.pages ? `p. ${book.pagesRead} / ${book.pages} · ` : ''}{book.percent}%
                </p>
              </>
            )}
            {book.lastFinished && (
              <div className={styles.finished}>
                <p className="label label-sm">Last finished</p>
                <p className={styles.body}>
                  <a href={book.lastFinished.url}>{book.lastFinished.title}</a>
                  {book.lastFinished.date && <span className={styles.finishedDate}> · {shortDate(book.lastFinished.date)}</span>}
                </p>
              </div>
            )}
          </li>
        )}
      </ul>
      </div>
    </section>
  );
}
