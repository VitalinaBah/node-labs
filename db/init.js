import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';

const SCHEMA_PATH = path.join(process.cwd(), 'db', 'schema.sql');

const init = async () => {
  const sql = await fs.readFile(SCHEMA_PATH, 'utf-8');
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
    multipleStatements: true,
  });
  await conn.query(sql);
  console.log('[INIT] schema applied');
  await conn.end();
};

init().catch((err) => { console.error(err); process.exit(1); });
