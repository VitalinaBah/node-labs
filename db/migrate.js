import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const SCHEMA_PATH = path.join(process.cwd(), 'db', 'schema.sql');

/**
 * Аналогічно до Lab 5: рахуємо md5-хеш schema.sql, порівнюємо з останнім
 * записом у таблиці migrations. Якщо інший — попередження.
 */
export const checkSchemaHash = async (fastify) => {
  try {
    const sql = await fs.readFile(SCHEMA_PATH, 'utf-8');
    const currentHash = crypto.createHash('md5').update(sql).digest('hex');

    const [rows] = await fastify.mysql.execute(
      'SELECT hash FROM migrations ORDER BY id DESC LIMIT 1',
    );

    if (rows.length === 0) {
      await fastify.mysql.execute(
        'INSERT INTO migrations (hash) VALUES (?)',
        [currentHash],
      );
      fastify.log.info('[MIGRATE] initial schema hash збережено');
      return;
    }

    if (rows[0].hash !== currentHash) {
      fastify.log.warn(
        '[MIGRATE] Схема db/schema.sql змінилась з моменту останнього запуску. ' +
          'Виконайте міграцію вручну та оновіть запис у таблиці migrations.',
      );
    } else {
      fastify.log.info('[MIGRATE] схема актуальна');
    }
  } catch (err) {
    fastify.log.warn({ err }, '[MIGRATE] не вдалося перевірити хеш схеми');
  }
};
