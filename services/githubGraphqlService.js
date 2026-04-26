import { fetchWithTimeout } from './externalService.js';
import { getContributors } from './githubRestService.js';

const GQL = 'https://api.github.com/graphql';
const CONCURRENCY = 5;

const REPOS_QUERY = `
  query($login: String!, $first: Int!) {
    user(login: $login) {
      repositories(
        first: $first
        privacy: PUBLIC
        isFork: false
        ownerAffiliations: [OWNER]
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        nodes { nameWithOwner }
      }
    }
  }
`;

const gqlRequest = async (query, variables) => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN required for GraphQL API');

  const res = await fetchWithTimeout(GQL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'lab6-fastify-uzhnu',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  return json.data;
};

export const getUserReposGraphQL = async (login) => {
  try {
    const data = await gqlRequest(REPOS_QUERY, { login, first: 100 });
    return data?.user?.repositories?.nodes?.map((n) => n.nameWithOwner) ?? [];
  } catch (err) {
    console.warn(`[github-graphql] repos for ${login}: ${err.message}`);
    return [];
  }
};

export const findSharedReposGraphQL = async (owner, repo) => {
  const contributors = (await getContributors(owner, repo)).filter(
    (l) => l && l !== owner,
  );

  const counter = new Map();
  for (let i = 0; i < contributors.length; i += CONCURRENCY) {
    const batch = contributors.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((l) => getUserReposGraphQL(l)));
    for (const repos of results) {
      for (const fullName of repos) {
        if (fullName === `${owner}/${repo}`) continue;
        counter.set(fullName, (counter.get(fullName) || 0) + 1);
      }
    }
  }

  return [...counter.entries()]
    .map(([full_name, sharedContributors]) => ({ full_name, sharedContributors }))
    .sort((a, b) => b.sharedContributors - a.sharedContributors)
    .slice(0, 5);
};
