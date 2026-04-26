import { getSharedReposRest } from '#controllers/githubController.js';
import { sharedReposQuerySchema, sharedReposResponseSchema } from '#schemas/githubSchemas.js';

const githubV1Routes = async (fastify) => {
  fastify.get(
    '/shared-repos',
    {
      schema: {
        tags: ['github v1 (REST)'],
        summary: 'Топ-5 репозиторіїв зі спільними контриб’юторами (REST API)',
        querystring: sharedReposQuerySchema,
        response: { 200: sharedReposResponseSchema },
      },
    },
    getSharedReposRest,
  );
};

export default githubV1Routes;
