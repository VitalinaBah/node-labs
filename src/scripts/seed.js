import mysql from 'mysql2/promise';

const FORCE = process.argv.includes('--force');

const SAMPLE = [
  { name: 'Ivan',  course: 2, grades: [5, 4, 5], email: 'ivan@example.com'  },
  { name: 'Anna',  course: 3, grades: [4, 5, 5], email: 'anna@example.com'  },
  { name: 'Petro', course: 1, grades: [3, 4, 4], email: 'petro@example.com' },
  { name: 'Maria', course: 4, grades: [5, 5, 5], email: 'maria@example.com' },
];

const seed = async () => {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
  });
  console.log('[SEED] connected');

  const [rows] = await conn.execute('SELECT COUNT(*) AS total FROM students');
  const existing = Number(rows[0].total);

  if (FORCE) {
    await conn.execute('DELETE FROM students');
    await conn.execute('ALTER TABLE students AUTO_INCREMENT = 1');
    console.log('[SEED] --force: cleared table');
  } else if (existing > 0) {
    console.log(`[SEED] table has ${existing} rows — skip (use seed:force)`);
    await conn.end();
    return;
  }

  for (const s of SAMPLE) {
    await conn.execute(
      'INSERT INTO students (name, grades, course, email, image) VALUES (?, ?, ?, ?, NULL)',
      [s.name, JSON.stringify(s.grades), s.course, s.email],
    );
  }
  console.log(`[SEED] inserted ${SAMPLE.length} students`);
  await conn.end();
};

seed().catch((err) => { console.error(err); process.exit(1); });
