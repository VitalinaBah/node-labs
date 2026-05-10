import fp from 'fastify-plugin';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from './schema.js';

/**
 * Drizzle працює поверх вже зареєстрованого fastify.mysql пулу.
 * Залежність mysql-plugin перевіряється fastify-plugin'ом —
 * якщо порядок реєстрації порушено, отримаєш помилку при boot.
 */
async function drizzlePlugin(fastify) {
  if (!fastify.mysql) {
    throw new Error('MySQL pool is not registered. Register mysql plugin before drizzle.');
  }

  const db = drizzle(fastify.mysql, { schema, mode: 'default' });
  fastify.decorate('drizzle', db);

  fastify.addHook('onClose', async () => {
    fastify.log.info('[Drizzle] layer closed');
  });
}

export default fp(drizzlePlugin, {
  name: 'drizzle-plugin',
  dependencies: ['mysql-plugin'],
});
