/**
 * Централізовані ключі Redis. Усі сервіси використовують ці константи,
 * щоб не було розкиданих рядкових літералів по коду.
 */
export const REDIS_KEYS = Object.freeze({
  // Кеш курсів з зовнішнього API (json-server) — TTL 120 секунд (Lab 6)
  COURSE: (id) => `course:${id}`,

  // Кеш сторінки списку студентів — TTL 24 години (Lab 9 п.7)
  STUDENTS_PAGE: ({ page, limit, course }) =>
    `students:list:page=${page}:limit=${limit}:course=${course ?? 'all'}`,
  STUDENTS_PAGE_PATTERN: 'students:list:*',
});

export const REDIS_TTL = Object.freeze({
  COURSE: 120,         // 2 хвилини
  STUDENTS_PAGE: 86400, // 24 години
});
