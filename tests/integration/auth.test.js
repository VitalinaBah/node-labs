import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getApp, closeApp, clearAll } from './helpers.js';

describe('Auth flow (JWT)', () => {
  let app;

  beforeAll(async () => { app = await getApp(); });
  afterAll(async () => { await closeApp(); });
  beforeEach(async () => { await clearAll(app); });

  describe('POST /api/v1/auth/register', () => {
    it('201 + user без password при валідних даних', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'u@test.com', password: 'pwd12345' },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body).toMatchObject({ email: 'u@test.com' });
      expect(body).not.toHaveProperty('password');
      expect(body).toHaveProperty('id');
    });

    it('409 коли email вже зареєстрований', async () => {
      await app.inject({
        method: 'POST', url: '/api/v1/auth/register',
        payload: { email: 'u@test.com', password: 'pwd12345' },
      });
      const res = await app.inject({
        method: 'POST', url: '/api/v1/auth/register',
        payload: { email: 'u@test.com', password: 'other-pwd' },
      });
      expect(res.statusCode).toBe(409);
    });

    it('400 при невалідному email', async () => {
      const res = await app.inject({
        method: 'POST', url: '/api/v1/auth/register',
        payload: { email: 'not-an-email', password: 'pwd12345' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('400 при короткому паролі', async () => {
      const res = await app.inject({
        method: 'POST', url: '/api/v1/auth/register',
        payload: { email: 'u@test.com', password: '123' },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await app.inject({
        method: 'POST', url: '/api/v1/auth/register',
        payload: { email: 'u@test.com', password: 'pwd12345' },
      });
    });

    it('200 + accessToken і refresh у cookie', async () => {
      const res = await app.inject({
        method: 'POST', url: '/api/v1/auth/login',
        payload: { email: 'u@test.com', password: 'pwd12345' },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.accessToken).toMatch(/^eyJ/);
      expect(res.cookies.find((c) => c.name === 'refreshToken')).toBeDefined();
    });

    it('401 при невірному паролі', async () => {
      const res = await app.inject({
        method: 'POST', url: '/api/v1/auth/login',
        payload: { email: 'u@test.com', password: 'wrong-pwd' },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('повертає новий access по валідному refresh-cookie', async () => {
      await app.inject({
        method: 'POST', url: '/api/v1/auth/register',
        payload: { email: 'u@test.com', password: 'pwd12345' },
      });
      const loginRes = await app.inject({
        method: 'POST', url: '/api/v1/auth/login',
        payload: { email: 'u@test.com', password: 'pwd12345' },
      });
      const refreshCookie = loginRes.cookies.find((c) => c.name === 'refreshToken');

      const res = await app.inject({
        method: 'POST', url: '/api/v1/auth/refresh',
        cookies: { refreshToken: refreshCookie.value },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().accessToken).toMatch(/^eyJ/);
    });

    it('401 без refresh-cookie', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('204 і додає jti у blacklist (старий токен стає невалідним)', async () => {
      await app.inject({
        method: 'POST', url: '/api/v1/auth/register',
        payload: { email: 'u@test.com', password: 'pwd12345' },
      });
      const loginRes = await app.inject({
        method: 'POST', url: '/api/v1/auth/login',
        payload: { email: 'u@test.com', password: 'pwd12345' },
      });
      const { accessToken } = loginRes.json();
      const refreshCookie = loginRes.cookies.find((c) => c.name === 'refreshToken');

      const logoutRes = await app.inject({
        method: 'POST', url: '/api/v1/auth/logout',
        headers: { authorization: `Bearer ${accessToken}` },
        cookies: { refreshToken: refreshCookie.value },
      });
      expect(logoutRes.statusCode).toBe(204);

      // POST зі старим токеном після logout → 401 (blacklist)
      const protectedRes = await app.inject({
        method: 'POST', url: '/api/v1/students',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { name: 'X', course: 2 },
      });
      expect(protectedRes.statusCode).toBe(401);
    });
  });
});
