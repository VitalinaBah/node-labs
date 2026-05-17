import { describe, it, expect } from 'vitest';
import { REDIS_KEYS, REDIS_TTL } from '../../constants/redisKeys.js';

describe('REDIS_KEYS', () => {
  it('COURSE будує ключ за id', () => {
    expect(REDIS_KEYS.COURSE(42)).toBe('course:42');
  });

  it('STUDENTS_PAGE враховує всі параметри пагінації', () => {
    expect(REDIS_KEYS.STUDENTS_PAGE({ page: 1, limit: 10 }))
      .toBe('students:list:page=1:limit=10:course=all');
    expect(REDIS_KEYS.STUDENTS_PAGE({ page: 2, limit: 5, course: 3 }))
      .toBe('students:list:page=2:limit=5:course=3');
  });

  it('REFRESH_TOKEN та JWT_BLACKLIST будують ключі', () => {
    expect(REDIS_KEYS.REFRESH_TOKEN(1)).toBe('refresh:1');
    expect(REDIS_KEYS.JWT_BLACKLIST('abc-uuid')).toBe('blacklist:abc-uuid');
  });

  it('TTL значення коректні', () => {
    expect(REDIS_TTL.COURSE).toBe(120);
    expect(REDIS_TTL.STUDENTS_PAGE).toBe(86400);
    expect(REDIS_TTL.REFRESH_TOKEN).toBe(604800);
  });
});
