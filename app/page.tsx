import { SiteHeader } from '@/components/SiteHeader';
import { Hatch } from '@/components/sketch/PencilFilters';
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

const skills = [
  { title: 'Product', items: ['PRDs & product teardowns', 'RICE & MoSCoW prioritization', 'User & competitor research', 'Agile: sprint planning, backlogs', 'Translating between design, eng & stakeholders'] },
  { title: 'Engineering', items: ['Java · C · MicroPython · JavaScript', 'React · Next.js · Node.js · Tailwind', 'Supabase · Claude API', 'Embedded systems & sensors', 'Power BI'] },
  { title: 'Design', items: ['Figma · Canva', 'Brand identity: logo, type, color', 'Illustration & character design', 'Visual systems for progress & rewards'] },
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
            <Hatch label="your photo" className={styles.photoImg} />
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
          <p className={`lede ${styles.lede}`}>I&apos;m a third-year software engineering student at the University of Calgary (Schulich), with a previous degree in biological sciences. I like the space where design, engineering and people meet, which is why I&apos;m heading toward product management while still building as an engineer.</p>
          <p className={`lede ${styles.lede}`}>Right now I&apos;m Co-VP Internal at ZOO, our software &amp; electrical engineering society, leading a team of four on marketing and operations for 1,300+ members.</p>
          <div className="btn-row">
            <SocialButtons order={['resume', 'linkedin', 'github']} />
          </div>
          <p className={`aside ${styles.open}`}>→ open to PM &amp; SWE internships, 2027</p>
        </div>
      </section>

      <Workbench />

      <ProjectsSection projects={getProjectSummaries()} />

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
          <p style={{ margin: 0, fontSize: 18 }}>drawing · journaling · gaming · volleyball</p>
        </div>
      </section>

      <NotesSection
        notes={notes.map(({ slug, title, date }) => ({ slug, title, date }))}
        bodies={Object.fromEntries(notes.map((n) => [n.slug, <Prose key={n.slug} source={n.body} />]))}
      />

      <Guestbook initial={wall} />

      {/* CONTACT */}
      <section id="contact" style={{ padding: '24px 0 64px' }}>
        <div className="sketch" style={{ background: 'var(--card)', padding: '56px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 18 }}>
          <h2 className="hand" style={{ margin: 0, fontWeight: 700, fontSize: 'clamp(56px, 9vw, 76px)', lineHeight: 1 }}>let&apos;s talk.</h2>
          <p className="lede" style={{ maxWidth: 520 }}>Hiring for a PM or SWE intern, building something fun, or just want to swap sketchbook pages? My inbox is open.</p>
          <a href={`mailto:${site.email}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 20, letterSpacing: '.04em', color: 'var(--accent)', overflowWrap: 'anywhere' }}>{site.email}</a>
          <div className="btn-row" style={{ justifyContent: 'center', marginTop: 8 }}>
            <SocialButtons order={['linkedin', 'github', 'resume']} />
          </div>
        </div>
        <footer className="label" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, padding: '36px 0 8px', fontSize: 13, letterSpacing: 0, textTransform: 'none' }}>
          <span>Drawn &amp; built by Noor Ali</span>
          <span>Calgary, AB · 2026</span>
        </footer>
      </section>
    </div>
  );
}
