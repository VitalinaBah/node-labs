import { eq, count } from 'drizzle-orm';
import { Readable } from 'node:stream';
import { students } from '../db/schema.js';

/**
 * Фабрика репозиторію над Drizzle ORM.
 * DI: createStudentsRepository(fastify.drizzle).
 */
export const createStudentsRepository = (db) => {
  const fromRow = (row) => {
    if (!row) return null;
    let grades = row.grades;
    if (typeof grades === 'string') {
      try { grades = JSON.parse(grades); } catch { grades = []; }
    }
    return { ...row, grades: grades ?? [] };
  };

  const findAll = async () => {
    const rows = await db.select().from(students).orderBy(students.id);
    return rows.map(fromRow);
  };

  const findByCourse = async (course) => {
    const rows = await db
      .select()
      .from(students)
      .where(eq(students.course, Number(course)))
      .orderBy(students.id);
    return rows.map(fromRow);
  };

  const findById = async (id) => {
    const rows = await db.select().from(students).where(eq(students.id, Number(id))).limit(1);
    return rows.length ? fromRow(rows[0]) : null;
  };

  const findPage = async ({ page = 1, limit = 10, course } = {}) => {
    const where = course !== undefined ? eq(students.course, Number(course)) : undefined;

    const baseCount = db.select({ total: count() }).from(students);
    const countQuery = where ? baseCount.where(where) : baseCount;
    const [{ total }] = await countQuery;

    const baseSelect = db.select().from(students).orderBy(students.id);
    const filtered = where ? baseSelect.where(where) : baseSelect;
    const rows = await filtered.limit(Number(limit)).offset((page - 1) * limit);

    return { data: rows.map(fromRow), total: Number(total) };
  };

  const create = async (data) => {
    const result = await db.insert(students).values({
      name: data.name,
      grades: data.grades ?? [],
      course: Number(data.course),
      email: data.email ?? null,
      image: data.image ?? null,
    });
    const insertId = Array.isArray(result) ? result[0]?.insertId : result?.insertId;
    return findById(insertId);
  };

  const update = async (id, updates) => {
    const existing = await findById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    await db
      .update(students)
      .set({
        name: merged.name,
        grades: merged.grades ?? [],
        course: Number(merged.course),
        email: merged.email ?? null,
        image: merged.image ?? null,
      })
      .where(eq(students.id, Number(id)));
    return findById(id);
  };

  const remove = async (id) => {
    const existing = await findById(id);
    if (!existing) return false;
    await db.delete(students).where(eq(students.id, Number(id)));
    return true;
  };

  /** Курсор: Drizzle не має нативного стрімінгу для mysql2 → читаємо все і генеруємо. */
  const cursor = () => {
    const promise = findAll();
    return Readable.from((async function* () {
      const rows = await promise;
      for (const r of rows) yield r;
    })(), { objectMode: true });
  };

  return { findAll, findByCourse, findById, findPage, create, update, remove, cursor };
};
