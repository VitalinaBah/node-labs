import { buildApp } from '../../src/app.js';
import { students, users } from '../../db/schema.js';

let cachedApp = null;

/**
 * Створює застосунок один раз для всього test-runу. Кожен файл закриває не сам інстанс,
 * а лише дані — це швидше за повторне підняття всього стеку.
 */
export const getApp = async () => {
  if (!cachedApp) {
    cachedApp = await buildApp();
    await cachedApp.ready();
  }
  return cachedApp;
};

export const closeApp = async () => {
  if (cachedApp) {
    await cachedApp.close();
    cachedApp = null;
  }
};

/** Очистити таблиці та Redis. */
export const clearAll = async (app) => {
  await app.drizzle.delete(students);
  await app.drizzle.delete(users);
  await app.redis.flushdb();
};

/** Зареєструвати тестового користувача та повернути accessToken. */
export const registerAndLogin = async (app, email = 'test@example.com', password = 'password123') => {
  await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: { email, password },
  });
  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email, password },
  });
  return loginRes.json();
};
