import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'node:events';
import { createStudentsCacheService } from '../../services/studentsCacheService.js';

describe('studentsCacheService', () => {
  let mockRedis;
  let mockLog;
  let svc;

  beforeEach(() => {
    mockRedis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
      scanStream: vi.fn(),
    };
    mockLog = { warn: vi.fn(), info: vi.fn() };
    svc = createStudentsCacheService({ redis: mockRedis, log: mockLog });
  });

  it('get повертає null коли в кеші немає значення', async () => {
    const result = await svc.get({ page: 1, limit: 10 });
    expect(result).toBeNull();
    expect(mockRedis.get).toHaveBeenCalledWith('students:list:page=1:limit=10:course=all');
  });

  it('get парсить JSON якщо значення є', async () => {
    const payload = { data: [], meta: {} };
    mockRedis.get.mockResolvedValueOnce(JSON.stringify(payload));

    const result = await svc.get({ page: 1, limit: 10, course: 2 });
    expect(result).toEqual(payload);
    expect(mockRedis.get).toHaveBeenCalledWith('students:list:page=1:limit=10:course=2');
  });

  it('set серіалізує значення та виставляє TTL 24 години', async () => {
    const payload = { data: [{ id: 1 }] };
    await svc.set({ page: 2, limit: 5 }, payload);

    expect(mockRedis.set).toHaveBeenCalledWith(
      'students:list:page=2:limit=5:course=all',
      JSON.stringify(payload),
      'EX',
      86400,
    );
  });

  it('invalidateAll сканує і видаляє ключі за патерном', async () => {
    const stream = new EventEmitter();
    mockRedis.scanStream.mockReturnValueOnce(stream);

    const promise = svc.invalidateAll();
    stream.emit('data', ['students:list:page=1:limit=10:course=all']);
    stream.emit('data', ['students:list:page=2:limit=10:course=all']);
    stream.emit('end');

    const total = await promise;
    expect(total).toBe(2);
    expect(mockRedis.scanStream).toHaveBeenCalledWith({
      match: 'students:list:*',
      count: 100,
    });
  });
});
