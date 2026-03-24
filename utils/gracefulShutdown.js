const gracefulShutdown = async (signal, fastify) => {
  fastify.log.info(`[SYSTEM] Отримано сигнал: ${signal}. Закриваємо ресурси...`);

  const forceExitTimeout = setTimeout(() => {
    fastify.log.error('[SYSTEM] Не вдалося завершити роботу вчасно. Примусовий вихід.');
    process.exit(1);
  }, 10000);

  try {
    await fastify.close();
    clearTimeout(forceExitTimeout);
    process.exit(0);
  } catch (err) {
    clearTimeout(forceExitTimeout);
    fastify.log.error({ err }, '[SYSTEM] Помилка при закритті сервера');
    process.exit(1);
  }
};

export default gracefulShutdown;