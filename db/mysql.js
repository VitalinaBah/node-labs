import fp from 'fastify-plugin';
import mysql from 'mysql2/promise';

/**
 * Pool з'єднань до MySQL. Реєструється як fastify-plugin →
 * декоратор fastify.mysql доступний у будь-якому маршруті/плагіні.
 */
async function mysqlPlugin(fastify) {
  const pool = mysql.createPool({
    host: fastify.config.MYSQL_HOST,
    port: Number(fastify.config.MYSQL_PORT),
    user: fastify.config.MYSQL_USER,
    password: fastify.config.MYSQL_PASSWORD,
    database: fastify.config.MYSQL_DB,
    waitForConnections: true,
    connectionLimit: 10,
  });

  try {
    const connection = await pool.getConnection();
    connection.release();
    fastify.log.info('[MySQL] pool connected');
  } catch (err) {
    fastify.log.error({ err }, '[MySQL] connection error');
    process.exit(1);
  }

  fastify.decorate('mysql', pool);

  fastify.addHook('onClose', async () => {
    await pool.end();
    fastify.log.info('[MySQL] pool closed');
  });
}

export default fp(mysqlPlugin, { name: 'mysql-plugin' });
