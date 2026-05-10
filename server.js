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
import fp from 'fastify-plugin';
import { envSchema } from '#schemas/envSchema.js';
import gracefulShutdown from '#utils/gracefulShutdown.js';
import ENV from '#constants/environments.js';
import { runBackup } from '#utils/backup.js';
import apiV1Plugin from '#plugins/apiV1.js';
import apiV2Plugin from '#plugins/apiV2.js';
import realtimePlugin from '#plugins/realtime.js';
import mysqlPlugin from './db/mysql.js';
import drizzlePlugin from './db/drizzle.js';
import redisPlugin from './db/redis.js';
import { createStudentsRepository } from '#repositories/studentsRepository.js';
import { createStudentsCacheService } from '#services/studentsCacheService.js';
import { createExternalService } from '#services/externalService.js';

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

// Шар БД
await fastify.register(mysqlPlugin);
await fastify.register(drizzlePlugin);

// Lab 9: Redis перед rate-limit, бо rate-limit його використовує
await fastify.register(redisPlugin);

// Сервіси через DI (factory + decorate)
await fastify.register(
  fp(async (f) => {
    f.decorate('studentsRepo', createStudentsRepository(f.drizzle));
    f.decorate('studentsCacheSvc', createStudentsCacheService({ redis: f.redis, log: f.log }));
    f.decorate('externalSvc', createExternalService({
      redis: f.redis,
      baseUrl: f.config.EXTERNAL_API_URL,
      log: f.log,
    }));
  }, { name: 'app-services', dependencies: ['drizzle-plugin', 'redis-plugin'] }),
);

await fastify.register(fastifyCors, {
  origin: fastify.config.NODE_ENV === ENV.DEVELOPMENT ? '*' : fastify.config.ALLOWED_ORIGIN,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
});
await fastify.register(fastifyHelmet, { global: true, contentSecurityPolicy: false });
await fastify.register(fastifySensible);
await fastify.register(fastifyMultipart);

// Lab 9: rate-limit на Redis store
await fastify.register(fastifyRateLimit, {
  max: 100,
  timeWindow: '1 minute',
  redis: fastify.redis,
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
      title: 'Lab 9 API — Students (Redis cache + Rate-limit)',
      description: 'Lab_9_Redis: Redis-кеш для зовнішнього API і списку студентів, rate-limit на Redis store.',
      version: '1.0.0',
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 3000}` }],
    tags: [
      { name: 'health',  description: 'Перевірка стану сервера' },
      { name: 'items v1', description: 'Студенти — REST API v1' },
      { name: 'items v2', description: 'Студенти — REST API v2 (з пагінацією + кеш Redis)' },
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
await fastify.register(fastifyStatic, { root: join(__dirname, 'uploads'), prefix: '/files' });

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
