import { buildApp } from './src/app.js';
import gracefulShutdown from '#utils/gracefulShutdown.js';
import { runBackup } from '#utils/backup.js';

const app = await buildApp();

process.on('SIGINT', () => gracefulShutdown('SIGINT', app));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM', app));
process.on('uncaughtException', (err) => {
  app.log.fatal({ err }, '[CRITICAL] Uncaught Exception');
  gracefulShutdown('uncaughtException', app);
});
process.on('unhandledRejection', (reason) => {
  app.log.fatal({ reason }, '[CRITICAL] Unhandled Rejection');
  gracefulShutdown('unhandledRejection', app);
});

await runBackup(app);

await app.listen({ port: app.config.PORT, host: app.config.HOSTNAME });
app.log.info(`Swagger UI: http://${app.config.HOSTNAME}:${app.config.PORT}/docs`);
