import fp from 'fastify-plugin';
import fastifyRedis from '@fastify/redis';

/**
 * Глобальний Redis-клієнт (ioredis). closeClient: true — гарантує
 * закриття з'єднання при fastify.close().
 */
async function redisPlugin(fastify) {
  await fastify.register(fastifyRedis, {
    host: fastify.config.REDIS_HOST,
    port: Number(fastify.config.REDIS_PORT),
    closeClient: true,
  });

  // Перевіримо живий старт; якщо Redis недоступний — exit
  try {
    await fastify.redis.ping();
    fastify.log.info('[Redis] connected');
  } catch (err) {
    fastify.log.error({ err }, '[Redis] connection error');
    process.exit(1);
  }
}

export default fp(redisPlugin, { name: 'redis-plugin' });
