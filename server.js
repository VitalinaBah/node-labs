import Fastify from 'fastify';
import fastifyEnv from '@fastify/env';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifySensible from '@fastify/sensible';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { envSchema } from '#schemas/envSchema.js';
import healthRoutes from '#routes/health.js';
import studentRoutes from '#routes/students.js';
import gracefulShutdown from '#utils/gracefulShutdown.js';
import ENV from '#constants/environments.js';
import { runBackup } from '#utils/backup.js';
import StudentModel from './src/models/item.model.js';

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

await fastify.register(fastifyCors, {
  origin: fastify.config.NODE_ENV === ENV.DEVELOPMENT ? '*' : fastify.config.ALLOWED_ORIGIN,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
});

await fastify.register(fastifyHelmet, { global: true });
await fastify.register(fastifySensible);
await fastify.register(fastifyMultipart);

await fastify.register(fastifyStatic, {
  root: join(__dirname, 'uploads'),
  prefix: '/files',
});

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

await runBackup(fastify.log);

const currentHash = crypto.createHash('md5').update(JSON.stringify(StudentModel)).digest('hex');
try {
  const content = await fs.readFile(join(process.cwd(), 'data', 'version.json'), 'utf-8');
  const { hash } = JSON.parse(content);
  if (hash !== currentHash) {
    fastify.log.warn('Data schema changed. Run "npm run migrate" to update existing files.');
  }
} catch {
  // version.json ще не існує — ок
}

await fastify.listen({ port: fastify.config.PORT, host: fastify.config.HOSTNAME });