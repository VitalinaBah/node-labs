import { Transform } from 'node:stream';

/**
 * Серіалізує об'єкти у NDJSON: один JSON-об'єкт на рядок, розділений '\n'.
 * Вхід — об'єкти (writableObjectMode), вихід — рядки (readableObjectMode: false).
 */
export class NdjsonTransform extends Transform {
  constructor() {
    super({ writableObjectMode: true, readableObjectMode: false });
  }

  _transform(chunk, _encoding, callback) {
    try {
      callback(null, JSON.stringify(chunk) + '\n');
    } catch (err) {
      callback(err);
    }
  }
}
