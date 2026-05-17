import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createExternalService } from '../../services/externalService.js';

describe('externalService.findCourseById', () => {
  let mockRedis;
  let mockLog;
  let service;
  let fetchSpy;

  beforeEach(() => {
    mockRedis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
    };
    mockLog = { warn: vi.fn(), info: vi.fn() };
    service = createExternalService({
      redis: mockRedis,
      baseUrl: 'http://localhost:3001',
      log: mockLog,
    });
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  it('повертає дані з кешу якщо вони там є', async () => {
    const cached = { id: 2, name: 'Software Engineering', credits: 240 };
    mockRedis.get.mockResolvedValueOnce(JSON.stringify(cached));

    const result = await service.findCourseById(2);

    expect(result).toEqual(cached);
    expect(mockRedis.get).toHaveBeenCalledWith('course:2');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('звертається до API при cache miss і кешує результат', async () => {
    const apiResponse = { id: 3, name: 'Data Science', credits: 180 };
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => apiResponse,
    });

    const result = await service.findCourseById(3);

    expect(result).toEqual(apiResponse);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(mockRedis.set).toHaveBeenCalledWith(
      'course:3',
      JSON.stringify(apiResponse),
      'EX',
      120,
    );
  });

  it('повертає null при недоступному API і відсутньому кеші (graceful)', async () => {
    fetchSpy.mockRejectedValue(new Error('Network down'));

    const result = await service.findCourseById(99);

    expect(result).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(3); // 3 спроби retry
    expect(mockLog.warn).toHaveBeenCalled();
  });
});
