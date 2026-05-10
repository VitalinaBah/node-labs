import { eq } from 'drizzle-orm';
import { users } from '../db/schema.js';

/**
 * Users repository — фабрика, отримує Drizzle через DI.
 */
export const createUsersRepository = (db) => {
  const findByEmail = async (email) => {
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return rows[0] ?? null;
  };

  const findById = async (id) => {
    const rows = await db.select().from(users).where(eq(users.id, Number(id))).limit(1);
    return rows[0] ?? null;
  };

  const create = async ({ email, password }) => {
    const result = await db.insert(users).values({ email, password });
    const insertId = Array.isArray(result) ? result[0]?.insertId : result?.insertId;
    return findById(insertId);
  };

  return { findByEmail, findById, create };
};
