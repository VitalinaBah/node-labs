import { getHealth, getHealthDetails } from '#controllers/healthController.js';
import ERROR_MESSAGES from '#constants/errorMessages.js';

const TAG = 'health';

const healthRoutesV1 = async (fastify) => {
  fastify.get(
    '/',
    {
      schema: {
        tags: [TAG],
        summary: 'Перевірка стану сервера (public)',
        response: {
          200: {
            type: 'object',
            properties: { status: { type: 'string' } },
          },
        },
      },
    },
    getHealth,
  );

  fastify.get(
    '/details',
    {
      schema: {
        tags: [TAG],
        summary: 'Деталізована інформація (admin, x-api-key)',
        security: [{ apiKey: [] }],
      },
      onRequest: async (request, reply) => {
        const apiKey = request.headers['x-api-key'];
        if (!apiKey || apiKey !== fastify.config.ADMIN_API_KEY) {
          return reply.unauthorized(ERROR_MESSAGES.UNAUTHORIZED);
        }
      },
    },
    getHealthDetails,
  );
};

export default healthRoutesV1;
