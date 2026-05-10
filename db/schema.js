import { mysqlTable, int, varchar, json } from 'drizzle-orm/mysql-core';

/**
 * Variant 4 — Students. Drizzle описує таблицю програмно;
 * SQL генерується через `drizzle-kit generate`.
 */
export const students = mysqlTable('students', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  grades: json('grades').notNull(),
  course: int('course').notNull(),
  email: varchar('email', { length: 255 }),
  image: varchar('image', { length: 255 }),
});
