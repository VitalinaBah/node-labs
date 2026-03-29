import fs from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data', 'items');
const BACKUPS_DIR = path.join(process.cwd(), 'data', 'backups');
const MAX_BACKUPS = 5;

export const runBackup = async (logger) => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(BACKUPS_DIR, { recursive: true });

  const files = (await fs.readdir(DATA_DIR)).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    logger.info('[BACKUP] Немає файлів для бекапу.');
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(BACKUPS_DIR, timestamp);
  await fs.mkdir(backupDir, { recursive: true });

  for (const file of files) {
    await fs.copyFile(path.join(DATA_DIR, file), path.join(backupDir, file));
  }
  logger.info(`[BACKUP] Бекап створено: ${backupDir}`);
  
  const allBackups = (await fs.readdir(BACKUPS_DIR)).sort();
  if (allBackups.length > MAX_BACKUPS) {
    const toDelete = allBackups.slice(0, allBackups.length - MAX_BACKUPS);
    for (const dir of toDelete) {
      await fs.rm(path.join(BACKUPS_DIR, dir), { recursive: true });
      logger.info(`[BACKUP] Видалено старий бекап: ${dir}`);
    }
  }
};