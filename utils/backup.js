import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';

const DATA_DIR = path.join(process.cwd(), 'data', 'items');
const BACKUPS_DIR = path.join(process.cwd(), 'data', 'backups');
const MAX_BACKUPS = 5;

/**
 * Збирає всі JSON-файли з data/items/, об'єднує їх у один JSON-масив
 * і записує у стиснений архів data/backups/{timestamp}.gz через pipeline().
 * Залишає не більше MAX_BACKUPS останніх архівів.
 */
export const runBackup = async (logger) => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(BACKUPS_DIR, { recursive: true });

  const files = (await fs.readdir(DATA_DIR)).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    logger.info('[BACKUP] Немає файлів для бекапу.');
    await pruneOldBackups(logger);
    return null;
  }

  const items = await Promise.all(
    files.map(async (f) => {
      const raw = await fs.readFile(path.join(DATA_DIR, f), 'utf-8');
      return JSON.parse(raw);
    }),
  );

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archivePath = path.join(BACKUPS_DIR, `${timestamp}.gz`);

  // Source: serialized JSON як Readable; Transform: gzip; Sink: WriteStream.
  // pipeline() гарантує коректний backpressure і знищення стрімів при помилці.
  const source = Readable.from([JSON.stringify(items, null, 2)]);
  await pipeline(source, createGzip(), createWriteStream(archivePath));

  logger.info(`[BACKUP] Створено стиснений бекап: ${archivePath}`);

  await pruneOldBackups(logger);
  return archivePath;
};

const pruneOldBackups = async (logger) => {
  const archives = (await fs.readdir(BACKUPS_DIR))
    .filter((f) => f.endsWith('.gz'))
    .sort(); // ISO timestamp у назві → лексикографічне сортування == хронологічне

  if (archives.length > MAX_BACKUPS) {
    const toDelete = archives.slice(0, archives.length - MAX_BACKUPS);
    for (const file of toDelete) {
      await fs.unlink(path.join(BACKUPS_DIR, file));
      logger.info(`[BACKUP] Видалено старий бекап: ${file}`);
    }
  }
};
