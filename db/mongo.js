import fp from 'fastify-plugin';
import mongoose from 'mongoose';

/**
 * Підключення до MongoDB через Mongoose.
 * Реєструється через fastify-plugin → декоратор fastify.mongoose доступний глобально.
 * При помилці підключення — process.exit(1).
 * Закриття з'єднання — через хук onClose.
 */
async function mongoPlugin(fastify) {
  try {
    await mongoose.connect(fastify.config.MONGO_URL, {
      dbName: fastify.config.MONGO_DB_NAME,
    });
    fastify.log.info('[MongoDB] connected');
    fastify.decorate('mongoose', mongoose);
  } catch (err) {
    fastify.log.error({ err }, '[MongoDB] connection error');
    process.exit(1);
  }

  fastify.addHook('onClose', async () => {
    await mongoose.connection.close();
    fastify.log.info('[MongoDB] connection closed');
  });
}

export default fp(mongoPlugin, { name: 'mongo-plugin' });
