import { findSharedReposRest } from '../services/githubRestService.js';
import { findSharedReposGraphQL } from '../services/githubGraphqlService.js';

const parseRepo = (str) => {
  const [owner, name] = String(str).split('/');
  return { owner, name };
};

export const getSharedReposRest = async (request, reply) => {
  const { repo } = request.query;
  const { owner, name } = parseRepo(repo);
  if (!owner || !name) return reply.badRequest('repo має бути у форматі owner/name');

  try {
    const top = await findSharedReposRest(owner, name);
    return reply.send({ source: 'rest', repo, top });
  } catch (err) {
    request.log.error({ err }, 'github rest failed');
    return reply.serviceUnavailable(`GitHub REST API недоступний: ${err.message}`);
  }
};

export const getSharedReposGraphQL = async (request, reply) => {
  const { repo } = request.query;
  const { owner, name } = parseRepo(repo);
  if (!owner || !name) return reply.badRequest('repo має бути у форматі owner/name');

  // Якщо немає токена — graceful fallback на REST
  if (!process.env.GITHUB_TOKEN) {
    try {
      const top = await findSharedReposRest(owner, name);
      return reply.send({ source: 'graphql-fallback-rest', repo, top });
    } catch (err) {
      request.log.error({ err }, 'github fallback rest failed');
      return reply.serviceUnavailable(`GitHub API недоступний: ${err.message}`);
    }
  }

  try {
    const top = await findSharedReposGraphQL(owner, name);
    return reply.send({ source: 'graphql', repo, top });
  } catch (err) {
    request.log.error({ err }, 'github graphql failed; trying rest');
    try {
      const top = await findSharedReposRest(owner, name);
      return reply.send({ source: 'graphql-fallback-rest', repo, top });
    } catch (restErr) {
      return reply.serviceUnavailable(`GitHub API недоступний: ${restErr.message}`);
    }
  }
};
