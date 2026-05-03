import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import ERROR_MESSAGES from '#constants/errorMessages.js';

const BACKUPS_DIR = path.join(process.cwd(), 'data', 'backups');
const TAG = 'backups';

// timestamp у форматі ISO зі заміненими ':' / '.' на '-'
const TS_PATTERN = '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]{3}Z$';

const backupRoutes = async (fastify) => {
  fastify.get(
    '/:timestamp',
    {
      schema: {
        tags: [TAG],
        summary: 'Потокова віддача .gz бекапу (захищено x-api-key)',
        params: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', pattern: TS_PATTERN },
          },
          required: ['timestamp'],
        },
        security: [{ apiKey: [] }],
      },
      onRequest: async (request, reply) => {
        const apiKey = request.headers['x-api-key'];
        if (!apiKey || apiKey !== fastify.config.ADMIN_API_KEY) {
          return reply.unauthorized(ERROR_MESSAGES.UNAUTHORIZED);
        }
      },
    },
    async (request, reply) => {
      const { timestamp } = request.params;
      const filePath = path.join(BACKUPS_DIR, `${timestamp}.gz`);

      // Захист від path traversal
      if (!filePath.startsWith(BACKUPS_DIR + path.sep)) {
        return reply.badRequest('Invalid path');
      }

      try {
        await fsp.access(filePath, fs.constants.R_OK);
      } catch {
        return reply.notFound('Backup not found');
      }

      reply.header('Content-Type', 'application/gzip');
      reply.header(
        'Content-Disposition',
        `attachment; filename="${timestamp}.gz"`,
      );
      // Потокова віддача — без буферизації всього файлу в пам'яті
      return reply.send(fs.createReadStream(filePath));
    },
  );
};

export default backupRoutes;
