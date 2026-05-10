import { existsSync } from 'node:fs';

// Drizzle Kit не запускається через node --env-file, тож завантажуємо .env вручну
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const pwd = process.env.MYSQL_PASSWORD;

/** @type {import('drizzle-kit').Config} */
export default {
  schema: './db/schema.js',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    // Порожній password має бути undefined, інакше drizzle-kit падає
    password: pwd && pwd.length > 0 ? pwd : undefined,
    database: process.env.MYSQL_DB || 'lab8_students',
  },
};
