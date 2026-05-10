import { registerBodySchema, loginBodySchema, userResponseSchema } from '#schemas/authSchema.js';

const TAG = 'auth';

const authRoutes = async (fastify) => {
  // POST /auth/register
  fastify.post(
    '/register',
    {
      schema: {
        tags: [TAG],
        summary: 'Реєстрація користувача',
        body: registerBodySchema,
        response: { 201: userResponseSchema },
      },
    },
    async (request, reply) => {
      try {
        const user = await fastify.authSvc.register(request.body);
        return reply.code(201).send(user);
      } catch (err) {
        if (err.statusCode === 409) return reply.conflict(err.message);
        throw err;
      }
    },
  );

  // POST /auth/login
  fastify.post(
    '/login',
    {
      schema: {
        tags: [TAG],
        summary: 'Вхід — створення сесії',
        body: loginBodySchema,
        response: {
          200: {
            type: 'object',
            properties: { success: { type: 'boolean' }, user: userResponseSchema },
          },
        },
      },
    },
    async (request, reply) => {
      const user = await fastify.authSvc.verify(request.body);
      if (!user) return reply.unauthorized('Invalid credentials');
      request.session.userId = user.id;
      return reply.send({ success: true, user });
    },
  );

  // POST /auth/logout
  fastify.post(
    '/logout',
    {
      schema: { tags: [TAG], summary: 'Вихід — знищення сесії' },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      await request.session.destroy();
      return reply.code(204).send();
    },
  );

  // GET /auth/me
  fastify.get(
    '/me',
    {
      schema: { tags: [TAG], summary: 'Поточний користувач' },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const user = await fastify.authSvc.findById(request.session.userId);
      if (!user) return reply.unauthorized();
      return reply.send(user);
    },
  );
};

export default authRoutes;
