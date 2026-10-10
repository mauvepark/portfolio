import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

/** /robots.txt: crawl everything public; skip the admin area and API routes. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
