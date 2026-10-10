import 'server-only';

export type CurrentBook = {
  title: string;
  authors: string[];
  url: string;
  pages: number | null;
  pagesRead: number | null;
  /** 0–100 */
  percent: number | null;
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
      }
      user_book_reads(order_by: { id: desc }, limit: 1) { progress_pages progress }
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
            };
            user_book_reads: { progress_pages: number | null; progress: number | null }[];
          }[];
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
    const entry = (Array.isArray(me) ? me[0] : me)?.user_books[0];
    if (!entry) return null;

    const { book } = entry;
    const read = entry.user_book_reads[0];
    // Credit authors only, not translators, illustrators or editors.
    const authors = book.contributions
      .filter((c) => !c.contribution || c.contribution === 'Author')
      .map((c) => c.author.name);
    const percent = read?.progress ?? (read?.progress_pages && book.pages ? (read.progress_pages / book.pages) * 100 : null);

    return {
      title: book.title,
      authors,
      url: `https://hardcover.app/books/${book.slug}`,
      pages: book.pages,
      pagesRead: read?.progress_pages ?? null,
      percent: percent === null ? null : Math.min(100, Math.max(0, Math.round(percent))),
    };
  } catch {
    return null;
  }
}
