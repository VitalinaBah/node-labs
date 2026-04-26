import { fetchWithRetry } from './externalService.js';

const API = 'https://api.github.com';

const authHeaders = () => {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'lab6-fastify-uzhnu',
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export const getContributors = async (owner, repo) => {
  const list = await fetchWithRetry(
    `${API}/repos/${owner}/${repo}/contributors?per_page=100`,
    { headers: authHeaders() },
  );
  return Array.isArray(list) ? list.map((c) => c.login).filter(Boolean) : [];
};

export const getUserRepos = async (login) => {
  const list = await fetchWithRetry(
    `${API}/users/${login}/repos?per_page=100&type=owner&sort=updated`,
    { headers: authHeaders() },
  );
  return Array.isArray(list) ? list.filter((r) => !r.fork) : [];
};

export const findSharedReposRest = async (owner, repo) => {
  const contributors = await getContributors(owner, repo);
  const counter = new Map();

  for (const login of contributors) {
    if (!login || login === owner) continue;
    let userRepos;
    try {
      userRepos = await getUserRepos(login);
    } catch (err) {
      console.warn(`[github-rest] skip ${login}: ${err.message}`);
      continue;
    }
    for (const r of userRepos) {
      const key = r.full_name;
      if (key === `${owner}/${repo}`) continue;
      counter.set(key, (counter.get(key) || 0) + 1);
    }
  }

  return [...counter.entries()]
    .map(([full_name, sharedContributors]) => ({ full_name, sharedContributors }))
    .sort((a, b) => b.sharedContributors - a.sharedContributors)
    .slice(0, 5);
};
