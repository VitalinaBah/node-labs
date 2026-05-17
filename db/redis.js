import fp from 'fastify-plugin';
import fastifyRedis from '@fastify/redis';

/**
 * Глобальний Redis-клієнт (ioredis). closeClient: true — гарантує
 * закриття з'єднання при fastify.close().
 *
 * REDIS_DB — номер логічної БД (0..15). Дозволяє ізолювати тестове
 * середовище від dev на тому ж Redis-інстансі: dev використовує 0,
 * тести — 1.
 */
async function redisPlugin(fastify) {
  await fastify.register(fastifyRedis, {
    host: fastify.config.REDIS_HOST,
    port: Number(fastify.config.REDIS_PORT),
    db: Number(fastify.config.REDIS_DB ?? 0),
    closeClient: true,
  });

  try {
    await fastify.redis.ping();
    fastify.log.info(`[Redis] connected (db=${fastify.config.REDIS_DB ?? 0})`);
  } catch (err) {
    fastify.log.error({ err }, '[Redis] connection error');
    process.exit(1);
  }
}

export default fp(redisPlugin, { name: 'redis-plugin' });
