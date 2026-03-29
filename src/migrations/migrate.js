import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import StudentModel from '../models/item.model.js';

const DATA_DIR = path.join(process.cwd(), 'data', 'items');
const VERSION_FILE = path.join(process.cwd(), 'data', 'version.json');

const getModelHash = () => {
  const str = JSON.stringify(StudentModel);
  return crypto.createHash('md5').update(str).digest('hex');
};

const atomicWrite = async (filePath, data) => {
  const tmpPath = filePath.replace('.json', '.tmp.json');
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tmpPath, filePath);
};

export const runMigration = async (logger) => {
  const currentHash = getModelHash();

  let savedHash = null;
  try {
    const content = await fs.readFile(VERSION_FILE, 'utf-8');
    savedHash = JSON.parse(content).hash;
  } catch {
    // файл не існує — перший запуск
  }

  if (currentHash === savedHash) {
    logger?.info('[MIGRATE] Схема не змінилась, міграція не потрібна.');
    return;
  }

  logger?.info('[MIGRATE] Схема змінилась, запускаємо міграцію...');

  await fs.mkdir(DATA_DIR, { recursive: true });
  const files = (await fs.readdir(DATA_DIR)).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const student = JSON.parse(content);
    const migrated = { ...StudentModel, ...student };
    await atomicWrite(filePath, migrated);
  }

  await fs.mkdir(path.dirname(VERSION_FILE), { recursive: true });
  await atomicWrite(VERSION_FILE, { hash: currentHash });

  logger?.info(`[MIGRATE] Міграцію завершено. Оновлено ${files.length} файлів.`);
};

// Якщо запускається напряму через npm run migrate
runMigration(console);