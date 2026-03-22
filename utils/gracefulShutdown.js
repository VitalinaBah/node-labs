const gracefulShutdown = (signal, server) => {
  console.log(`\n[SYSTEM] Отримано сигнал: ${signal}. Закриваємо ресурси...`);

  const forceExitTimeout = setTimeout(() => {
    console.error(
      "[SYSTEM] Не вдалося завершити роботу вчасно. Примусовий вихід.",
    );
    process.exit(1);
  }, 10000);

  server.close((err) => {
    clearTimeout(forceExitTimeout);
    if (err) {
      console.error("[SYSTEM] Помилка при закритті сервера:", err);
      process.exit(1);
    }
    console.log("[SYSTEM] Сервер успішно зупинено. Процес завершено.");
    process.exit(0);
  });
};

module.exports = gracefulShutdown;
