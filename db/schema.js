import { mysqlTable, int, varchar, json } from 'drizzle-orm/mysql-core';

// Variant 4 — Students
export const students = mysqlTable('students', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  grades: json('grades').notNull(),
  course: int('course').notNull(),
  email: varchar('email', { length: 255 }),
  image: varchar('image', { length: 255 }),
});

// Lab 9 — таблиця користувачів для auth
export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
});
