import fs from 'node:fs/promises';
import path from 'node:path';
import StudentModel from '../src/models/item.model.js';

const DATA_DIR = path.join(process.cwd(), 'data', 'items');

const atomicWrite = async (filePath, data) => {
  const tmpPath = filePath.replace('.json', '.tmp.json');
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tmpPath, filePath);
};

const getFilePath = (id) => path.join(DATA_DIR, `${id}.json`);

const readStudent = async (id) => {
  const content = await fs.readFile(getFilePath(id), 'utf-8');
  return JSON.parse(content);
};

const listStudentFiles = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const files = (await fs.readdir(DATA_DIR)).filter((f) => f.endsWith('.json'));
  // сортуємо за числовим id, щоб порядок був стабільним для пагінації
  return files.sort(
    (a, b) => Number(a.replace('.json', '')) - Number(b.replace('.json', '')),
  );
};

export const findAll = async () => {
  const files = await listStudentFiles();
  const students = await Promise.all(
    files.map((f) => readStudent(f.replace('.json', ''))),
  );
  return students;
};

export const findByCourse = async (course) => {
  const all = await findAll();
  return all.filter((s) => Number(s.course) === Number(course));
};

export const findById = async (id) => {
  try {
    return await readStudent(id);
  } catch {
    return null;
  }
};

/**
 * Поступова пагінація: читає файли по одному (без Promise.all і без findAll),
 * накопичує лише потрібну сторінку. Опційний фільтр за course.
 * Повертає { data, total } — total це кількість записів, що пройшли фільтр.
 */
export const findPage = async ({ page = 1, limit = 10, course } = {}) => {
  const files = await listStudentFiles();

  const startIdx = (page - 1) * limit;
  const endIdx = startIdx + limit;

  const data = [];
  let total = 0;

  for (const file of files) {
    const student = await readStudent(file.replace('.json', ''));
    if (course !== undefined && Number(student.course) !== Number(course)) {
      continue;
    }
    if (total >= startIdx && total < endIdx) {
      data.push(student);
    }
    total++;
  }

  return { data, total };
};

export const create = async (data) => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  // для генерації нового id достатньо знати найбільший — читаємо лише імена файлів,
  // не самі файли
  const files = await listStudentFiles();
  const ids = files.map((f) => Number(f.replace('.json', '')));
  const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
  const newStudent = { ...StudentModel, ...data, id: newId };
  await atomicWrite(getFilePath(newId), newStudent);
  return newStudent;
};

export const update = async (id, updates) => {
  const student = await findById(id);
  if (!student) return null;
  const updated = { ...student, ...updates, id: student.id };
  await atomicWrite(getFilePath(id), updated);
  return updated;
};

export const remove = async (id) => {
  try {
    await fs.unlink(getFilePath(id));
    return true;
  } catch {
    return false;
  }
};
