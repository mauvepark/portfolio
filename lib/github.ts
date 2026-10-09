import 'server-only';
import { site } from './site';

export type RecentRepo = {
  name: string;
  url: string;
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
    repositories(first: 5, privacy: PUBLIC, ownerAffiliations: OWNER, orderBy: { field: PUSHED_AT, direction: DESC }) {
      nodes {
        name url pushedAt
        defaultBranchRef { target { ... on Commit { history(first: 10) { nodes { message url parents { totalCount } } } } } }
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
          defaultBranchRef: {
            target: { history?: { nodes: { message: string; url: string; parents: { totalCount: number } }[] } };
          } | null;
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
      repos: user.repositories.nodes
        // Skip the profile README repo (named after the account); it isn't a project.
        .filter((r) => r.name.toLowerCase() !== site.githubUser.toLowerCase())
        .slice(0, 2)
        .map((r) => {
          // Latest real commit: merge commits ("Merge pull request #1 from …") say nothing about the work.
          const commit = r.defaultBranchRef?.target.history?.nodes.find((c) => c.parents.totalCount === 1);
          return {
            name: r.name,
            url: r.url,
            pushedAt: r.pushedAt,
            lastCommit: commit ? { message: commit.message.split('\n')[0], url: commit.url } : null,
          };
        }),
    };
  } catch {
    return null;
  }
}
