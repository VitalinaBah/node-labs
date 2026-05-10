import mongoose from 'mongoose';
import { Student } from '../../db/models/student.model.js';

const FORCE = process.argv.includes('--force');

const SAMPLE = [
  { name: 'Ivan',   course: 2, grades: [5, 4, 5], email: 'ivan@example.com'  },
  { name: 'Anna',   course: 3, grades: [4, 5, 5], email: 'anna@example.com'  },
  { name: 'Petro',  course: 1, grades: [3, 4, 4], email: 'petro@example.com' },
  { name: 'Maria',  course: 4, grades: [5, 5, 5], email: 'maria@example.com' },
];

const seed = async () => {
  const url = process.env.MONGO_URL;
  const dbName = process.env.MONGO_DB_NAME;
  if (!url) { console.error('MONGO_URL is required'); process.exit(1); }

  await mongoose.connect(url, { dbName });
  console.log('[SEED] connected');

  const existing = await Student.countDocuments();
  if (FORCE) {
    await Student.deleteMany({});
    console.log('[SEED] --force: cleared collection');
  } else if (existing > 0) {
    console.log(`[SEED] collection has ${existing} docs — skip (use seed:force to override)`);
    await mongoose.connection.close();
    return;
  }

  const inserted = await Student.insertMany(SAMPLE);
  console.log(`[SEED] inserted ${inserted.length} students`);
  await mongoose.connection.close();
};

seed().catch((err) => { console.error(err); process.exit(1); });
