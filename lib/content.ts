import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const root = path.join(process.cwd(), 'content');

export type Project = {
  slug: string;
  title: string;
  order: number;
  kind: string;
  blurb: string;
  stack: string;
  cover: string;
  /** Cover image in public/ (1600x800); falls back to a hatched placeholder labelled `cover`. */
  image?: string;
  /** contain (default): whole drawing fits, spare space blends into the paper. cover: crop to fill (photos, screenshots). */
  imageFit?: 'contain' | 'cover';
  cta: string;
  /** External link; when absent the card links to /projects/[slug]. */
  href?: string;
  body: string;
};

export type Note = { slug: string; title: string; date: string; category?: string; tldr?: string; body: string };

function readDir<T>(dir: string): T[] {
  const full = path.join(root, dir);
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => {
      const { data, content } = matter(fs.readFileSync(path.join(full, f), 'utf8'));
      return { ...data, slug: f.replace(/\.mdx$/, ''), body: content } as T;
    });
}

export function getProjects(): Project[] {
  return readDir<Project>('projects').sort((a, b) => a.order - b.order);
}

export function getProject(slug: string) {
  return getProjects().find((p) => p.slug === slug);
}

export function projectHref(p: Project) {
  return p.href ?? `/projects/${p.slug}`;
}

/** What the client-side project views need: no MDX body, link already resolved. */
export type ProjectSummary = Omit<Project, 'body' | 'href' | 'order'> & { link: string };

export function getProjectSummaries(): ProjectSummary[] {
  return getProjects().map((project) => {
    const { body: _body, href: _href, order: _order, ...p } = project;
    return { ...p, link: projectHref(project) };
  });
}

export function getNotes(): Note[] {
  return readDir<Note>('notes').sort((a, b) => b.date.localeCompare(a.date));
}

export function getNote(slug: string) {
  return getNotes().find((n) => n.slug === slug);
}
