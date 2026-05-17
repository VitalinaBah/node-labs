import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createGunzip } from 'node:zlib';
import { Readable } from 'node:stream';
import { runBackup } from '../../utils/backup.js';

const BACKUPS_DIR = path.join(process.cwd(), 'data', 'backups');

describe('runBackup (gzip pipeline)', () => {
  let mockApp;

  beforeEach(async () => {
    await fs.mkdir(BACKUPS_DIR, { recursive: true });
    // прибираємо .gz що могли залишитись від попередніх запусків
    const existing = (await fs.readdir(BACKUPS_DIR)).filter((f) => f.endsWith('.gz'));
    await Promise.all(existing.map((f) => fs.unlink(path.join(BACKUPS_DIR, f))));

    mockApp = {
      log: { info: vi.fn(), warn: vi.fn() },
      studentsRepo: {
        findAll: vi.fn().mockResolvedValue([
          { id: 1, name: 'Ivan', course: 2 },
          { id: 2, name: 'Anna', course: 3 },
        ]),
      },
    };
  });

  it('повертає null коли немає даних', async () => {
    mockApp.studentsRepo.findAll.mockResolvedValueOnce([]);
    const result = await runBackup(mockApp);
    expect(result).toBeNull();
  });

  it('створює .gz архів з валідним JSON всередині', async () => {
    const archivePath = await runBackup(mockApp);
    expect(archivePath).toMatch(/\.gz$/);

    // Перевіряємо що в архіві справді коректний JSON
    const raw = await fs.readFile(archivePath);
    const decompressed = await new Promise((res, rej) => {
      const chunks = [];
      Readable.from([raw]).pipe(createGunzip())
        .on('data', (c) => chunks.push(c))
        .on('end', () => res(Buffer.concat(chunks).toString('utf-8')))
        .on('error', rej);
    });
    const parsed = JSON.parse(decompressed);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({ id: 1, name: 'Ivan' });
  });

  afterEach(async () => {
    // прибираємо .gz після тесту
    const existing = (await fs.readdir(BACKUPS_DIR)).filter((f) => f.endsWith('.gz'));
    await Promise.all(existing.map((f) => fs.unlink(path.join(BACKUPS_DIR, f))));
  });
});
