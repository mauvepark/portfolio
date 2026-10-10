import 'server-only';

export type CurrentBook = {
  title: string;
  authors: string[];
  url: string;
  pages: number | null;
  pagesRead: number | null;
  /** 0–100 */
  percent: number | null;
  /** Hardcover's community genre tags: the top one, plus a second only if it's as popular. */
  genres: string[];
  lastFinished: { title: string; url: string; date: string | null } | null;
};

const QUERY = `
query {
  me {
    user_books(where: { status_id: { _eq: 2 } }, order_by: { updated_at: desc }, limit: 1) {
      book {
        title
        slug
        pages
        contributions { contribution author { name } }
        cached_tags
      }
      user_book_reads(order_by: { id: desc }, limit: 1) { progress_pages progress }
    }
    last_finished: user_books(where: { status_id: { _eq: 3 } }, order_by: { last_read_date: desc_nulls_last }, limit: 1) {
      last_read_date
      book { title slug }
    }
  }
}`;

type Response = {
  data?: {
    me:
      | {
          user_books: {
            book: {
              title: string;
              slug: string;
              pages: number | null;
              contributions: { contribution: string | null; author: { name: string } }[];
              cached_tags: { Genre?: { tag: string; count: number }[] } | null;
            };
            user_book_reads: { progress_pages: number | null; progress: number | null }[];
          }[];
          last_finished: { last_read_date: string | null; book: { title: string; slug: string } }[];
        }[]
      | null;
  };
};

/**
 * The book most recently updated on Hardcover's "Currently Reading" shelf (status 2), via
 * Hardcover's GraphQL API with a read-only HARDCOVER_TOKEN. Hardcover requires queries to run
 * server-side. Cached for 10 minutes; null if unavailable or nothing is being read.
 */
export async function getCurrentBook(): Promise<CurrentBook | null> {
  const raw = process.env.HARDCOVER_TOKEN?.trim();
  if (!raw) return null;
  const token = /^bearer /i.test(raw) ? raw : `Bearer ${raw}`;

  try {
    const res = await fetch('https://api.hardcover.app/v1/graphql', {
      method: 'POST',
      headers: { authorization: token, 'content-type': 'application/json', 'user-agent': 'noor-portfolio (desk note)' },
      body: JSON.stringify({ query: QUERY }),
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const me = ((await res.json()) as Response).data?.me;
    const user = Array.isArray(me) ? me[0] : me;
    const entry = user?.user_books[0];
    if (!entry) return null;

    const { book } = entry;
    const read = entry.user_book_reads[0];
    // Credit authors only, not translators, illustrators or editors.
    const authors = book.contributions
      .filter((c) => !c.contribution || c.contribution === 'Author')
      .map((c) => c.author.name);
    // Genre tags are crowd-sourced and can be thin; keep the top one, and a second only if it ties.
    const tags = [...(book.cached_tags?.Genre ?? [])].sort((a, b) => b.count - a.count);
    const genres = tags.filter((t, i) => i === 0 || (i === 1 && t.count === tags[0].count)).map((t) => t.tag);
    const finished = user?.last_finished[0];
    const percent = read?.progress ?? (read?.progress_pages && book.pages ? (read.progress_pages / book.pages) * 100 : null);

    return {
      title: book.title,
      authors,
      url: `https://hardcover.app/books/${book.slug}`,
      pages: book.pages,
      pagesRead: read?.progress_pages ?? null,
      percent: percent === null ? null : Math.min(100, Math.max(0, Math.round(percent))),
      genres,
      lastFinished: finished
        ? { title: finished.book.title, url: `https://hardcover.app/books/${finished.book.slug}`, date: finished.last_read_date }
        : null,
    };
  } catch {
    return null;
  }
}
