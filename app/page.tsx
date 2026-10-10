import Image from 'next/image';
import { SiteHeader } from '@/components/SiteHeader';
import { getNotes, getProjectSummaries } from '@/lib/content';
import { ProjectsSection } from '@/components/projects/ProjectsSection';
import { site } from '@/lib/site';
import { Guestbook } from '@/components/guestbook/Guestbook';
import { Workbench } from '@/components/workbench/Workbench';
import { NotesSection } from '@/components/notes/NotesSection';
import { Prose } from '@/components/Prose';
import { PAGE_SIZE, PUBLIC_COLUMNS, type Entry } from '@/lib/guestbook';
import { supabasePublic } from '@/lib/supabase';
import styles from './page.module.css';

// Re-render at most once a minute; new doodles arrive in between via realtime.
export const revalidate = 60;

async function getWall(): Promise<Entry[]> {
  const { data } = await supabasePublic()
    .from('guestbook')
    .select(PUBLIC_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);
  return (data as Entry[] | null) ?? [];
}

// Sourced from the resume (public/resume.pdf): what's backed by real projects and roles.
const skills = [
  {
    title: 'Languages & Frameworks',
    items: ['TypeScript · JavaScript · SQL', 'Python · Java · C/C++', 'React · Next.js · Node.js', 'Express · Tailwind CSS', 'HTML/CSS · MicroPython', 'Pandas · NumPy'],
  },
  {
    title: 'Tools & Technologies',
    items: ['Supabase · PostgreSQL · REST APIs', 'Git/GitHub · Docker · Linux', 'CI/CD · PyTest · JUnit · TDD', 'Claude API · Claude Code · Cursor', 'Power BI · DAX · Power Query', 'Jira · Figma'],
  },
  {
    title: 'Product Skills',
    items: ['User research & usability testing', 'Competitive & market analysis', 'Roadmapping & backlog prioritization', 'PRDs & success metrics', 'Requirements gathering & stakeholder management', 'Agile/Scrum & sprint planning', 'UI/UX design & prototyping'],
  },
];

function SocialButtons({ order }: { order: ('resume' | 'linkedin' | 'github')[] }) {
  const labels = { resume: 'Resume', linkedin: 'LinkedIn', github: 'GitHub' };
  return (
    <>
      {order.map((k) => (
        <a key={k} className="btn sketch" href={site.links[k]}>[{labels[k]}]</a>
      ))}
    </>
  );
}

export default async function Home() {
  const notes = getNotes();
  const wall = await getWall();

  return (
    <div className="wrap">
      <SiteHeader />

      {/* ABOUT — sized to the window's height so the whole intro is visible on load */}
      <section id="about" className={styles.intro}>
        <div className={styles.photoCol}>
          <figure className={`sketch ${styles.photo}`}>
            <div className="tape" aria-hidden="true" />
            <Image
              src="/me.jpg"
              alt="Noor smiling on a rocky hiking trail"
              width={720}
              height={780}
              sizes="240px"
              priority
              className={styles.photoImg}
            />
            <figcaption className={`aside ${styles.caption}`}>probably sketching something</figcaption>
          </figure>
        </div>
        <div className={styles.text}>
          <p className="label">Software engineering · Product · Design</p>
          <h1 className={`hand ${styles.headline}`}>
            <span className={styles.line}>hi, I&apos;m Noor.</span>
            <span className={styles.line} style={{ color: 'var(--accent)' }}>I build things</span>
            <span className={styles.line}>and sketch the why.</span>
          </h1>
          <p className={`lede ${styles.lede}`}>I&apos;m a software engineering student with a background in biological sciences and a growing focus in product management. I started out studying biological sciences before switching into software, but my guiding principle has always been the same:</p>
          <p className={`hand ${styles.principle}`}>I like figuring out how complex systems work, then making them work better!</p>
          <div className="btn-row">
            <SocialButtons order={['resume', 'linkedin', 'github']} />
          </div>
          <p className={`aside ${styles.open}`}>→ open to PM &amp; SWE internships, 2027</p>
        </div>
      </section>

      <Workbench />

      <ProjectsSection
        projects={getProjectSummaries()}
        lead="That curiosity is what pulled me into product. Most recently I built Ramble, an AI-powered journaling app, from scratch: I wrote the PRD, benchmarked competing apps to shape the roadmap, and built it end to end with Next.js, Supabase and the Claude API. Before that, I grew an online community from zero to 1,500+ members, led the creation of a full-stack tool for League of Legends teams, and redesigned recruitment for a University of Calgary engineering team, more than doubling its membership."
      />

      {/* SKILLS */}
      <section id="skills" className="section">
        <h2 className="section-title" style={{ marginBottom: 36 }}>skills</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32 }}>
          {skills.map((s) => (
            <div key={s.title} className="panel sketch">
              <h3>{s.title}</h3>
              <ul>{s.items.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '10px 22px', marginTop: 40 }}>
          <p className="hand" style={{ margin: 0, fontSize: 30, fontWeight: 700 }}>off the clock:</p>
          <p style={{ margin: 0, fontSize: 18 }}>I&apos;m usually scrolling through Pinterest, solving my daily NYT games, or critiquing the city&apos;s newest cafe.</p>
        </div>
      </section>

      <NotesSection
        notes={notes.map(({ slug, title, date, category, tldr }) => ({ slug, title, date, category, tldr }))}
        bodies={Object.fromEntries(notes.map((n) => [n.slug, <Prose key={n.slug} source={n.body} />]))}
      />

      <Guestbook initial={wall} />

      {/* CONTACT */}
      <section id="contact" style={{ padding: '24px 0 64px' }}>
        <div className="sketch" style={{ background: 'var(--card)', padding: '56px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 18 }}>
          <h2 className="hand" style={{ margin: 0, fontWeight: 700, fontSize: 'clamp(56px, 9vw, 76px)', lineHeight: 1 }}>let&apos;s connect!</h2>
          <p className="lede" style={{ maxWidth: 520 }}>I&apos;d be happy to chat, so check out my social links below. Thanks for stopping by!</p>
          <a href={`mailto:${site.email}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 20, letterSpacing: '.04em', color: 'var(--accent)', overflowWrap: 'anywhere' }}>{site.email}</a>
          <div className="btn-row" style={{ justifyContent: 'center', marginTop: 8 }}>
            <SocialButtons order={['linkedin', 'github', 'resume']} />
          </div>
        </div>
        <footer className="label" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, padding: '36px 0 8px', fontSize: 13, letterSpacing: 0, textTransform: 'none' }}>
          <span>Sketched by Noor Ali</span>
          <span>Canada · 2026</span>
        </footer>
      </section>
    </div>
  );
}
