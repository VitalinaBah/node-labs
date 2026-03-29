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

export const findAll = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const files = await fs.readdir(DATA_DIR);
  const jsonFiles = files.filter((f) => f.endsWith('.json'));
  const students = await Promise.all(
    jsonFiles.map((f) => {
      const id = f.replace('.json', '');
      return readStudent(id);
    }),
  );
  return students;
};

export const findByCourse = async (course) => {
  const all = await findAll();
  return all.filter((s) => s.course === Number(course));
};

export const findById = async (id) => {
  try {
    return await readStudent(id);
  } catch {
    return null;
  }
};

export const create = async (data) => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const all = await findAll();
  const newId = all.length > 0 ? Math.max(...all.map((s) => s.id)) + 1 : 1;
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