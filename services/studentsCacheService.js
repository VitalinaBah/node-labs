import { REDIS_KEYS, REDIS_TTL } from '#constants/redisKeys.js';

/**
 * Сервіс кешування пагінованих списків студентів у Redis.
 * Lab 9 п.7: GET /api/v2/students кешується на 24 години;
 * POST/PATCH/DELETE інвалідують усі ключі за патерном students:list:*.
 */
export const createStudentsCacheService = ({ redis, log }) => {
  const get = async (params) => {
    const key = REDIS_KEYS.STUDENTS_PAGE(params);
    try {
      const cached = await redis.get(key);
      return cached !== null ? JSON.parse(cached) : null;
    } catch (err) {
      log?.warn?.({ err }, '[cache] read failed');
      return null;
    }
  };

  const set = async (params, value) => {
    const key = REDIS_KEYS.STUDENTS_PAGE(params);
    try {
      await redis.set(key, JSON.stringify(value), 'EX', REDIS_TTL.STUDENTS_PAGE);
    } catch (err) {
      log?.warn?.({ err }, '[cache] write failed');
    }
  };

  /**
   * Інвалідація: scanStream + DEL у пакетах. Не блокує Redis на великій кількості ключів.
   */
  const invalidateAll = async () => {
    return new Promise((resolve, reject) => {
      const stream = redis.scanStream({
        match: REDIS_KEYS.STUDENTS_PAGE_PATTERN,
        count: 100,
      });
      let total = 0;
      stream.on('data', (keys) => {
        if (keys.length) {
          total += keys.length;
          redis.del(keys).catch(() => { /* tolerate */ });
        }
      });
      stream.on('end', () => {
        if (total > 0) log?.info?.(`[cache] invalidated ${total} keys`);
        resolve(total);
      });
      stream.on('error', reject);
    });
  };

  return { get, set, invalidateAll };
};
