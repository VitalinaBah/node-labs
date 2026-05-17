import { describe, it, expect } from 'vitest';
import { Readable } from 'node:stream';
import { StudentAvgGradeTransform } from '../../src/transforms/studentAvgGradeTransform.js';
import { NdjsonTransform } from '../../src/transforms/ndjsonTransform.js';

async function collect(stream) {
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  return chunks;
}

describe('StudentAvgGradeTransform (Variant 4)', () => {
  it('замінює grades на avgGrade з округленням до 2 знаків', async () => {
    const source = Readable.from([
      { id: 1, name: 'Ivan', course: 2, grades: [5, 4, 5], email: 'i@x' },
    ], { objectMode: true });
    const t = new StudentAvgGradeTransform();
    const result = await collect(source.pipe(t));
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 1, name: 'Ivan', avgGrade: 4.67 });
    expect(result[0]).not.toHaveProperty('grades');
  });

  it('avgGrade = 0 коли grades порожній', async () => {
    const source = Readable.from([{ id: 2, grades: [] }], { objectMode: true });
    const result = await collect(source.pipe(new StudentAvgGradeTransform()));
    expect(result[0].avgGrade).toBe(0);
  });

  it('пропускає невалідні grades (не масив) як порожні', async () => {
    const source = Readable.from([{ id: 3, grades: null }], { objectMode: true });
    const result = await collect(source.pipe(new StudentAvgGradeTransform()));
    expect(result[0].avgGrade).toBe(0);
  });
});

describe('NdjsonTransform', () => {
  it('серіалізує об\'єкти в NDJSON-рядки', async () => {
    const source = Readable.from([{ a: 1 }, { b: 2 }], { objectMode: true });
    const t = new NdjsonTransform();
    const chunks = [];
    for await (const c of source.pipe(t)) {
      chunks.push(c.toString());
    }
    expect(chunks.join('')).toBe('{"a":1}\n{"b":2}\n');
  });
});
