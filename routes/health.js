import { getHealth, getHealthDetails } from '#controllers/healthController.js';
import { healthSchema, healthDetailsSchema } from '#schemas/healthSchemas.js';
import ERROR_MESSAGES from '#constants/errorMessages.js';

const healthRoutes = async (fastify) => {
  fastify.get('/', healthSchema, getHealth);

  fastify.get(
    '/details',
    {
      ...healthDetailsSchema,
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

export default healthRoutes;