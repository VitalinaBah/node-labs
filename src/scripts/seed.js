import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { count } from 'drizzle-orm';
import { students } from '../../db/schema.js';

const FORCE = process.argv.includes('--force');

const SAMPLE = [
  { name: 'Ivan',  course: 2, grades: [5, 4, 5], email: 'ivan@example.com'  },
  { name: 'Anna',  course: 3, grades: [4, 5, 5], email: 'anna@example.com'  },
  { name: 'Petro', course: 1, grades: [3, 4, 4], email: 'petro@example.com' },
  { name: 'Maria', course: 4, grades: [5, 5, 5], email: 'maria@example.com' },
];

const seed = async () => {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
  });
  const db = drizzle(pool);
  console.log('[SEED] connected');

  const [{ total }] = await db.select({ total: count() }).from(students);

  if (FORCE) {
    await db.delete(students);
    console.log('[SEED] --force: cleared');
  } else if (Number(total) > 0) {
    console.log(`[SEED] table has ${total} rows — skip (use seed:force)`);
    await pool.end();
    return;
  }

  for (const s of SAMPLE) {
    await db.insert(students).values({
      name: s.name,
      grades: s.grades,
      course: s.course,
      email: s.email,
      image: null,
    });
  }
  console.log(`[SEED] inserted ${SAMPLE.length} students`);
  await pool.end();
};

seed().catch((err) => { console.error(err); process.exit(1); });
