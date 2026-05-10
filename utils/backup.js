import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';

const BACKUPS_DIR = path.join(process.cwd(), 'data', 'backups');
const MAX_BACKUPS = 5;

/**
 * Lab 8: дані живуть у БД, тому бекап тепер — JSON-дамп з БД, стиснений gzip.
 * Викликати після реєстрації репозиторія: runBackup(fastify).
 */
export const runBackup = async (fastify) => {
  await fs.mkdir(BACKUPS_DIR, { recursive: true });

  const items = await fastify.studentsRepo.findAll();
  if (!items || items.length === 0) {
    fastify.log.info('[BACKUP] Колекція порожня — пропускаю.');
    await pruneOldBackups(fastify.log);
    return null;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archivePath = path.join(BACKUPS_DIR, `${timestamp}.gz`);
  const source = Readable.from([JSON.stringify(items, null, 2)]);
  await pipeline(source, createGzip(), createWriteStream(archivePath));
  fastify.log.info(`[BACKUP] Створено стиснений бекап: ${archivePath}`);

  await pruneOldBackups(fastify.log);
  return archivePath;
};

const pruneOldBackups = async (logger) => {
  const archives = (await fs.readdir(BACKUPS_DIR))
    .filter((f) => f.endsWith('.gz'))
    .sort();
  if (archives.length > MAX_BACKUPS) {
    for (const file of archives.slice(0, archives.length - MAX_BACKUPS)) {
      await fs.unlink(path.join(BACKUPS_DIR, file));
      logger.info(`[BACKUP] Видалено старий бекап: ${file}`);
    }
  }
};
