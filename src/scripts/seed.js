import fs from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data', 'items');

const INITIAL_STUDENTS = [
  { id: 1, name: 'Ivan', grades: [5, 4, 5], course: 2, email: 'ivan@example.com', image: null },
  { id: 2, name: 'Anna', grades: [4, 4, 5], course: 3, email: 'anna@example.com', image: null },
];

await fs.mkdir(DATA_DIR, { recursive: true });

for (const student of INITIAL_STUDENTS) {
  const filePath = path.join(DATA_DIR, `${student.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(student, null, 2), 'utf-8');
  console.log(`Created: ${filePath}`);
}

console.log('Seed completed.');