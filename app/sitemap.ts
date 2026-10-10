import type { MetadataRoute } from 'next';
import { getNotes, getProjects } from '@/lib/content';
import { site } from '@/lib/site';

/** /sitemap.xml: the homepage plus every case study and note page, for search engines. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const projects = getProjects().filter((p) => !p.href);
  const notes = getNotes();
  return [
    { url: `${site.url}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    ...projects.map((p) => ({ url: `${site.url}/projects/${p.slug}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 })),
    { url: `${site.url}/notes`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    ...notes.map((n) => ({
      url: `${site.url}/notes/${n.slug}`,
      lastModified: /^\d{4}-\d{2}-\d{2}$/.test(n.date) ? new Date(n.date) : now,
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    })),
  ];
}
