import 'server-only';
import { site } from './site';

export type RecentRepo = {
  name: string;
  url: string;
  language: string | null;
  pushedAt: string;
  lastCommit: { message: string; url: string } | null;
};

export type GithubActivity = {
  /** Contributions per day for the last 30 days, oldest first. */
  days: { date: string; count: number }[];
  last30: number;
  /** Rolling 12 months (GitHub's default calendar range). */
  pastYear: number;
  repos: RecentRepo[];
};

const QUERY = `
query ($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
    repositories(first: 3, privacy: PUBLIC, ownerAffiliations: OWNER, orderBy: { field: PUSHED_AT, direction: DESC }) {
      nodes {
        name url pushedAt
        primaryLanguage { name }
        defaultBranchRef { target { ... on Commit { message url } } }
      }
    }
  }
}`;

type Response = {
  data?: {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
          weeks: { contributionDays: { date: string; contributionCount: number }[] }[];
        };
      };
      repositories: {
        nodes: {
          name: string;
          url: string;
          pushedAt: string;
          primaryLanguage: { name: string } | null;
          defaultBranchRef: { target: { message?: string; url?: string } } | null;
        }[];
      };
    } | null;
  };
};

/** Public GitHub activity for the workbench. Cached for 5 minutes; null if unavailable. */
export async function getGithubActivity(): Promise<GithubActivity | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { login: site.githubUser } }),
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const user = ((await res.json()) as Response).data?.user;
    if (!user) return null;

    const calendar = user.contributionsCollection.contributionCalendar;
    const today = new Date().toISOString().slice(0, 10);
    const days = calendar.weeks
      .flatMap((w) => w.contributionDays)
      .filter((d) => d.date <= today)
      .slice(-30)
      .map((d) => ({ date: d.date, count: d.contributionCount }));

    return {
      days,
      last30: days.reduce((n, d) => n + d.count, 0),
      pastYear: calendar.totalContributions,
      repos: user.repositories.nodes.map((r) => {
        const commit = r.defaultBranchRef?.target;
        return {
          name: r.name,
          url: r.url,
          language: r.primaryLanguage?.name ?? null,
          pushedAt: r.pushedAt,
          lastCommit: commit?.message && commit.url ? { message: commit.message.split('\n')[0], url: commit.url } : null,
        };
      }),
    };
  } catch {
    return null;
  }
}
