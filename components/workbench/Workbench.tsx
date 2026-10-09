import now from '@/content/now.json';
import { getGithubActivity } from '@/lib/github';
import { site } from '@/lib/site';
import { Sparkline } from './Sparkline';
import styles from './Workbench.module.css';

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const daysAgo = Math.round(hours / 24);
  return daysAgo < 30 ? `${daysAgo}d ago` : new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

/** "On my desk": what I'm building now, plus live GitHub activity. GitHub notes hide if the API is unavailable. */
export async function Workbench() {
  const gh = await getGithubActivity();
  const placeholder = (s: string) => s.startsWith('[');

  return (
    <section id="workbench" className="section" aria-labelledby="workbench-title">
      <div className="section-head">
        <h2 id="workbench-title" className="section-title">on my desk</h2>
        <p className="label">{gh ? 'Live from GitHub · updates every 5 min' : `Updated ${now.updated}`}</p>
      </div>

      <ul className={styles.desk}>
        <li className={styles.note} style={{ '--tilt': '-1.6deg' } as React.CSSProperties}>
          <div className="tape" aria-hidden="true" />
          <p className="label label-sm">Currently building</p>
          <p className={styles.big}>{now.building}</p>
          {!placeholder(now.learning) && (
            <>
              <p className="label label-sm" style={{ marginTop: 14 }}>Learning</p>
              <p className={styles.body}>{now.learning}</p>
            </>
          )}
        </li>

        {gh && (
          <li className={styles.note} style={{ '--tilt': '1.2deg' } as React.CSSProperties}>
            <div className="tape" aria-hidden="true" />
            <p className="label label-sm">Contributions, last 30 days</p>
            <p className={styles.stat}>
              {gh.last30}
              <span className={styles.statNote}>{gh.pastYear} in the past year</span>
            </p>
            <Sparkline days={gh.days} />
          </li>
        )}

        {gh && gh.repos.length > 0 && (
          <li className={styles.note} style={{ '--tilt': '-0.8deg' } as React.CSSProperties}>
            <div className="tape" aria-hidden="true" />
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
                  {r.language && <span className={styles.lang}>{r.language}</span>}
                </li>
              ))}
            </ul>
            <a className="navlink" href={site.links.github}>[More on GitHub →]</a>
          </li>
        )}
      </ul>
    </section>
  );
}
