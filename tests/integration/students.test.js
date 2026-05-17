import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getApp, closeApp, clearAll, registerAndLogin } from './helpers.js';

describe('Students API', () => {
  let app;
  let token;

  beforeAll(async () => {
    app = await getApp();
  });
  afterAll(async () => { await closeApp(); });

  beforeEach(async () => {
    await clearAll(app);
    const login = await registerAndLogin(app);
    token = login.accessToken;
  });

  describe('GET /api/v1/students (публічний)', () => {
    it('200 + порожній масив коли БД порожня', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/students' });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual([]);
    });
  });

  describe('POST /api/v1/students (захищений)', () => {
    it('401 без Authorization-заголовка', async () => {
      const res = await app.inject({
        method: 'POST', url: '/api/v1/students',
        payload: { name: 'Test', course: 2, grades: [5, 4] },
      });
      expect(res.statusCode).toBe(401);
    });

    it('201 + створений студент з валідним токеном', async () => {
      const res = await app.inject({
        method: 'POST', url: '/api/v1/students',
        headers: { authorization: `Bearer ${token}` },
        payload: { name: 'Test', course: 2, grades: [5, 4, 5], email: 't@t.com' },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body).toMatchObject({ name: 'Test', course: 2 });
      expect(body).toHaveProperty('id');
    });

    it('400 при невалідному body (відсутній name)', async () => {
      const res = await app.inject({
        method: 'POST', url: '/api/v1/students',
        headers: { authorization: `Bearer ${token}` },
        payload: { course: 2 },
      });
      expect(res.statusCode).toBe(400);
    });

    it('400 при course поза діапазоном 1-6', async () => {
      const res = await app.inject({
        method: 'POST', url: '/api/v1/students',
        headers: { authorization: `Bearer ${token}` },
        payload: { name: 'X', course: 99 },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('PATCH /api/v1/students/:id (захищений)', () => {
    it('оновлює існуючого студента', async () => {
      const created = await app.inject({
        method: 'POST', url: '/api/v1/students',
        headers: { authorization: `Bearer ${token}` },
        payload: { name: 'Original', course: 2 },
      });
      const id = created.json().id;

      const patched = await app.inject({
        method: 'PATCH', url: `/api/v1/students/${id}`,
        headers: { authorization: `Bearer ${token}` },
        payload: { name: 'Updated' },
      });
      expect(patched.statusCode).toBe(200);
      expect(patched.json().name).toBe('Updated');
    });

    it('404 для неіснуючого id', async () => {
      const res = await app.inject({
        method: 'PATCH', url: '/api/v1/students/99999',
        headers: { authorization: `Bearer ${token}` },
        payload: { name: 'X' },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/v1/students/:id (захищений)', () => {
    it('видаляє студента', async () => {
      const created = await app.inject({
        method: 'POST', url: '/api/v1/students',
        headers: { authorization: `Bearer ${token}` },
        payload: { name: 'ToDelete', course: 2 },
      });
      const id = created.json().id;

      const res = await app.inject({
        method: 'DELETE', url: `/api/v1/students/${id}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);

      const after = await app.inject({ method: 'GET', url: `/api/v1/students/${id}` });
      expect(after.statusCode).toBe(404);
    });
  });
});

describe('Pagination + Redis cache (GET /api/v2/students)', () => {
  let app;
  let token;

  beforeAll(async () => { app = await getApp(); });
  afterAll(async () => { await closeApp(); });

  beforeEach(async () => {
    await clearAll(app);
    const login = await registerAndLogin(app);
    token = login.accessToken;
    // Додамо 5 студентів
    for (let i = 1; i <= 5; i++) {
      await app.inject({
        method: 'POST', url: '/api/v1/students',
        headers: { authorization: `Bearer ${token}` },
        payload: { name: `Student${i}`, course: (i % 6) + 1, grades: [5, 4] },
      });
    }
  });

  it('повертає правильний шматок + meta', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v2/students?page=1&limit=2' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toHaveLength(2);
    expect(body.meta).toMatchObject({ total: 5, page: 1, limit: 2, totalPages: 3 });
  });

  it('X-Cache: MISS на першому запиті, HIT на повторному', async () => {
    const r1 = await app.inject({ method: 'GET', url: '/api/v2/students?page=1&limit=2' });
    expect(r1.headers['x-cache']).toBe('MISS');

    const r2 = await app.inject({ method: 'GET', url: '/api/v2/students?page=1&limit=2' });
    expect(r2.headers['x-cache']).toBe('HIT');
  });

  it('POST інвалідовує кеш', async () => {
    await app.inject({ method: 'GET', url: '/api/v2/students?page=1&limit=2' }); // MISS
    await app.inject({ method: 'GET', url: '/api/v2/students?page=1&limit=2' }); // HIT

    await app.inject({
      method: 'POST', url: '/api/v1/students',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'New', course: 3 },
    });

    const r = await app.inject({ method: 'GET', url: '/api/v2/students?page=1&limit=2' });
    expect(r.headers['x-cache']).toBe('MISS');
  });
});

describe('Health endpoint', () => {
  let app;
  beforeAll(async () => { app = await getApp(); });
  afterAll(async () => { await closeApp(); });

  it('GET /api/v1/health → 200 ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok' });
  });
});
