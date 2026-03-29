import Fastify from 'fastify';
import fastifyEnv from '@fastify/env';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifySensible from '@fastify/sensible';
import { envSchema } from '#schemas/envSchema.js';
import healthRoutes from '#routes/health.js';
import studentRoutes from '#routes/students.js';
import gracefulShutdown from '#utils/gracefulShutdown.js';
import ENV from '#constants/environments.js';

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

await fastify.register(fastifyCors, {
  origin: fastify.config.NODE_ENV === ENV.DEVELOPMENT ? '*' : fastify.config.ALLOWED_ORIGIN,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
});

await fastify.register(fastifyHelmet, { global: true });

await fastify.register(fastifySensible);

fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(
    { err: error, url: request.url, method: request.method },
    'Request error',
  );
  reply.send(error);
});

await fastify.register(healthRoutes, { prefix: '/health' });
await fastify.register(studentRoutes, { prefix: '/students' });

fastify.addHook('onClose', () => {
  fastify.log.info('[SYSTEM] Fastify сервер закрито.');
});

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

await fastify.listen({ port: fastify.config.PORT, host: fastify.config.HOSTNAME });