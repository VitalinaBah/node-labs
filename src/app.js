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
import ENV from '#constants/environments.js';
import apiV1Plugin from '#plugins/apiV1.js';
import apiV2Plugin from '#plugins/apiV2.js';
import realtimePlugin from '#plugins/realtime.js';
import mysqlPlugin from '../db/mysql.js';
import drizzlePlugin from '../db/drizzle.js';
import redisPlugin from '../db/redis.js';
import jwtAuthPlugin from '#plugins/jwtAuth.js';
import { createStudentsRepository } from '#repositories/studentsRepository.js';
import { createStudentsCacheService } from '#services/studentsCacheService.js';
import { createExternalService } from '#services/externalService.js';
import { createUsersRepository } from '#services/usersRepository.js';
import { createAuthService } from '#services/authService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Фабрика застосунку. Створює Fastify-інстанс, реєструє всі плагіни,
 * але НЕ викликає listen() — це робить лише точка входу server.js.
 * Завдяки такому розділенню тести можуть створювати окремий інстанс
 * без зайняття мережевого порту через fastify.inject().
 */
export async function buildApp(opts = {}) {
  const isTest = process.env.NODE_ENV === 'test';
  const isDev = process.env.NODE_ENV !== ENV.PRODUCTION && !isTest;

  const app = Fastify({
    logger: isDev
      ? { level: 'info', transport: { target: 'pino-pretty', options: { colorize: true } } }
      : isTest ? false : { level: 'error' },
    ...opts,
  });

  await app.register(fastifyEnv, { schema: envSchema, dotenv: true });

  await app.register(mysqlPlugin);
  await app.register(drizzlePlugin);
  await app.register(redisPlugin);

  await app.register(
    fp(async (f) => {
      const usersRepo = createUsersRepository(f.drizzle);
      f.decorate('studentsRepo', createStudentsRepository(f.drizzle));
      f.decorate('studentsCacheSvc', createStudentsCacheService({ redis: f.redis, log: f.log }));
      f.decorate('externalSvc', createExternalService({
        redis: f.redis, baseUrl: f.config.EXTERNAL_API_URL, log: f.log,
      }));
      f.decorate('usersRepo', usersRepo);
      f.decorate('authSvc', createAuthService({ usersRepo }));
    }, { name: 'app-services', dependencies: ['drizzle-plugin', 'redis-plugin'] }),
  );

  await app.register(jwtAuthPlugin);

  await app.register(fastifyCors, {
    origin: app.config.NODE_ENV === ENV.DEVELOPMENT ? true : app.config.ALLOWED_ORIGIN,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  });
  await app.register(fastifyHelmet, { global: true, contentSecurityPolicy: false });
  await app.register(fastifySensible);
  await app.register(fastifyMultipart);

  await app.register(fastifyRateLimit, {
    max: isTest ? 10000 : 100,
    timeWindow: '1 minute',
    redis: app.redis,
    allowList: (req) => req.url.startsWith('/docs') || req.url.startsWith('/api/v1/ws'),
    errorResponseBuilder: (req, ctx) => ({
      statusCode: 429, error: 'Too Many Requests',
      message: `Перевищено ліміт ${ctx.max} запитів за ${ctx.after}.`,
    }),
  });

  await app.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.3',
      info: { title: 'Lab 10 API', version: '1.0.0' },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  });
  await app.register(fastifySwaggerUi, { routePrefix: '/docs' });
  await app.register(fastifyStatic, { root: join(__dirname, '..', 'uploads'), prefix: '/files' });

  app.setErrorHandler((error, request, reply) => {
    app.log.error({ err: error, url: request.url }, 'Request error');
    reply.send(error);
  });

  await app.register(realtimePlugin, { prefix: '/api/v1' });
  await app.register(apiV1Plugin, { prefix: '/api/v1' });
  await app.register(apiV2Plugin, { prefix: '/api/v2' });

  return app;
}
