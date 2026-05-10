import fp from 'fastify-plugin';
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import { REDIS_KEYS } from '#constants/redisKeys.js';

/**
 * Реєструє @fastify/cookie і @fastify/jwt з trusted callback,
 * що перевіряє JWT blacklist у Redis. Декорує fastify.authenticate.
 */
async function jwtAuthPlugin(fastify) {
  await fastify.register(fastifyCookie);

  await fastify.register(fastifyJwt, {
    secret: fastify.config.JWT_SECRET,
    sign: { expiresIn: '15m' }, // дефолтний access TTL
    /**
     * trusted викликається ПІСЛЯ верифікації підпису.
     * Якщо повертає false — токен відхиляється навіть з валідним підписом.
     * Тут перевіряємо чи jti не в blacklist Redis.
     */
    trusted: async (_request, decodedToken) => {
      if (!decodedToken.jti) return true; // refresh-токен без jti — пропускаємо
      const isBlacklisted = await fastify.redis.get(
        REDIS_KEYS.JWT_BLACKLIST(decodedToken.jti),
      );
      return !isBlacklisted;
    },
  });

  fastify.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
}

export default fp(jwtAuthPlugin, {
  name: 'jwt-auth',
  dependencies: ['redis-plugin'],
});
