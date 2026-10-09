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
  cta: string;
  /** External link; when absent the card links to /projects/[slug]. */
  href?: string;
  body: string;
};

export type Note = { slug: string; title: string; date: string; body: string };

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

export function getNotes(): Note[] {
  return readDir<Note>('notes').sort((a, b) => b.date.localeCompare(a.date));
}

export function getNote(slug: string) {
  return getNotes().find((n) => n.slug === slug);
}
