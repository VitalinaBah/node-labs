import Fastify from 'fastify';
import fastifyEnv from '@fastify/env';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifySensible from '@fastify/sensible';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { envSchema } from '#schemas/envSchema.js';
import gracefulShutdown from '#utils/gracefulShutdown.js';
import ENV from '#constants/environments.js';
import { runBackup } from '#utils/backup.js';
import apiV1Plugin from '#plugins/apiV1.js';
import apiV2Plugin from '#plugins/apiV2.js';
import realtimePlugin from '#plugins/realtime.js';
import mysqlPlugin from './db/mysql.js';
import { checkSchemaHash } from './db/migrate.js';
import { createStudentsRepository } from '#repositories/studentsRepository.js';
import fp from 'fastify-plugin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== ENV.PRODUCTION;

const fastify = Fastify({
  logger: isDev
    ? {
        level: 'info',
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        },
      }
    : { level: 'error' },
});

await fastify.register(fastifyEnv, { schema: envSchema, dotenv: true });

// БД першою
await fastify.register(mysqlPlugin);
await checkSchemaHash(fastify);

// Репозиторій через декоратор (DI)
await fastify.register(
  fp(async (f) => {
    f.decorate('studentsRepo', createStudentsRepository(f.mysql));
  }, { name: 'students-repo', dependencies: ['mysql-plugin'] }),
);

await fastify.register(fastifyCors, {
  origin: fastify.config.NODE_ENV === ENV.DEVELOPMENT ? '*' : fastify.config.ALLOWED_ORIGIN,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
});

await fastify.register(fastifyHelmet, { global: true, contentSecurityPolicy: false });
await fastify.register(fastifySensible);
await fastify.register(fastifyMultipart);

await fastify.register(fastifyRateLimit, {
  max: 100,
  timeWindow: '1 minute',
  allowList: (req) => req.url.startsWith('/docs') || req.url.startsWith('/api/v1/ws'),
  errorResponseBuilder: (req, ctx) => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: `Перевищено ліміт ${ctx.max} запитів за ${ctx.after}.`,
  }),
});

await fastify.register(fastifySwagger, {
  openapi: {
    openapi: '3.0.3',
    info: {
      title: 'Lab 8 API — Students (MySQL / mysql2)',
      description: 'REST API на базі MySQL через нативний драйвер mysql2. Гілка Lab_8_MySQL.',
      version: '1.0.0',
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 3000}` }],
    tags: [
      { name: 'health',  description: 'Перевірка стану сервера' },
      { name: 'items v1', description: 'Студенти — REST API v1' },
      { name: 'items v2', description: 'Студенти — REST API v2 (з пагінацією)' },
      { name: 'backups',  description: 'Завантаження gzip-бекапів (admin)' },
      { name: 'github v1 (REST)', description: 'GitHub-інтеграція' },
      { name: 'github v2 (REST + GraphQL)', description: 'GitHub GraphQL з фолбеком' },
    ],
    components: {
      securitySchemes: { apiKey: { type: 'apiKey', in: 'header', name: 'x-api-key' } },
    },
  },
});

await fastify.register(fastifySwaggerUi, {
  routePrefix: '/docs',
  uiConfig: { docExpansion: 'list', deepLinking: true },
});

await fastify.register(fastifyStatic, {
  root: join(__dirname, 'uploads'),
  prefix: '/files',
});

fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error({ err: error, url: request.url, method: request.method }, 'Request error');
  reply.send(error);
});

await fastify.register(realtimePlugin, { prefix: '/api/v1' });
await fastify.register(apiV1Plugin, { prefix: '/api/v1' });
await fastify.register(apiV2Plugin, { prefix: '/api/v2' });

fastify.addHook('onClose', () => fastify.log.info('[SYSTEM] Fastify сервер закрито.'));
process.on('SIGINT', () => gracefulShutdown('SIGINT', fastify));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM', fastify));
process.on('uncaughtException', (err) => {
  fastify.log.fatal({ err }, '[CRITICAL] Uncaught Exception');
  gracefulShutdown('uncaughtException', fastify);
});
process.on('unhandledRejection', (reason) => {
  fastify.log.fatal({ reason }, '[CRITICAL] Unhandled Rejection');
  gracefulShutdown('unhandledRejection', fastify);
});

await runBackup(fastify);

await fastify.listen({ port: fastify.config.PORT, host: fastify.config.HOSTNAME });
fastify.log.info(`Swagger UI: http://${fastify.config.HOSTNAME}:${fastify.config.PORT}/docs`);
fastify.log.info(`WebSocket:  ws://${fastify.config.HOSTNAME}:${fastify.config.PORT}/api/v1/ws`);
