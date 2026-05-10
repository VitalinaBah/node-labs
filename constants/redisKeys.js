export const REDIS_KEYS = Object.freeze({
  COURSE: (id) => `course:${id}`,
  STUDENTS_PAGE: ({ page, limit, course }) =>
    `students:list:page=${page}:limit=${limit}:course=${course ?? 'all'}`,
  STUDENTS_PAGE_PATTERN: 'students:list:*',
  // Lab 9 JWT
  REFRESH_TOKEN: (userId) => `refresh:${userId}`,
  JWT_BLACKLIST: (jti) => `blacklist:${jti}`,
});

export const REDIS_TTL = Object.freeze({
  COURSE: 120,
  STUDENTS_PAGE: 86400,
  REFRESH_TOKEN: 7 * 24 * 60 * 60, // 7 днів
});
