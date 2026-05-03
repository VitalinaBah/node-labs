import { Readable } from 'node:stream';
import fs from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data', 'items');

/**
 * Створює Readable у objectMode, який віддає по одному студенту за раз,
 * без завантаження всього набору в пам'ять. Список файлів читається лінькаво.
 */
export const createStudentsReadable = () => {
  let files = null;
  let idx = 0;
  let busy = false;

  return new Readable({
    objectMode: true,
    async read() {
      if (busy) return;
      busy = true;
      try {
        if (files === null) {
          await fs.mkdir(DATA_DIR, { recursive: true });
          files = (await fs.readdir(DATA_DIR))
            .filter((f) => f.endsWith('.json'))
            .sort();
        }
        if (idx >= files.length) {
          this.push(null);
          return;
        }
        const file = files[idx++];
        const raw = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
        this.push(JSON.parse(raw));
      } catch (err) {
        this.destroy(err);
      } finally {
        busy = false;
      }
    },
  });
};
