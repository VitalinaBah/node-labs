import { getSharedReposGraphQL } from '#controllers/githubController.js';
import { sharedReposQuerySchema, sharedReposResponseSchema } from '#schemas/githubSchemas.js';

const githubV2Routes = async (fastify) => {
  fastify.get(
    '/shared-repos',
    {
      schema: {
        tags: ['github v2 (REST + GraphQL)'],
        summary: 'Топ-5 репозиторіїв через GraphQL API (з REST-фолбеком)',
        querystring: sharedReposQuerySchema,
        response: { 200: sharedReposResponseSchema },
      },
    },
    getSharedReposGraphQL,
  );
};

export default githubV2Routes;
