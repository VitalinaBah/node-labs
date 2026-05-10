import fp from 'fastify-plugin';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import RedisStore from 'fastify-session-redis-store';

/**
 * Підключення сесій з Redis store.
 * Декорує fastify.authenticate — preHandler для захисту маршрутів.
 */
async function sessionAuthPlugin(fastify) {
  await fastify.register(fastifyCookie);

  await fastify.register(fastifySession, {
    secret: fastify.config.SESSION_SECRET,
    store: new RedisStore({ client: fastify.redis }),
    cookie: {
      httpOnly: true,
      secure: fastify.config.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 години
      sameSite: 'lax',
    },
    saveUninitialized: false,
  });

  fastify.decorate('authenticate', async (request, reply) => {
    if (!request.session.userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
}

export default fp(sessionAuthPlugin, {
  name: 'session-auth',
  dependencies: ['redis-plugin'],
});
