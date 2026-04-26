import * as studentsRepo from '#repositories/studentsRepository.js';
import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { studentBodySchema } from '#schemas/studentSchema.js';
import { formatImageUrl } from '#utils/formatImageUrl.js';
import { findCourseById } from '../services/externalService.js';

const ajv = new Ajv();
addFormats(ajv);
const validateStudent = ajv.compile(studentBodySchema);

const ALLOWED_MIME = ['image/jpeg', 'image/png'];
const MAX_SIZE = 5 * 1024 * 1024;

// GET /api/v1/students
const getStudents = async (request, reply) => {
  const { course } = request.query;
  const result = course
    ? await studentsRepo.findByCourse(course)
    : await studentsRepo.findAll();
  return reply.send(result.map((s) => ({ ...s, image: formatImageUrl(request, s.image) })));
};

// GET /api/v2/students  — пагінований список
const getStudentsPaginated = async (request, reply) => {
  const page = Number(request.query.page) || 1;
  const limit = Number(request.query.limit) || 10;
  const courseFilter = request.query.course;

  let all = await studentsRepo.findAll();
  if (courseFilter !== undefined) {
    all = all.filter((s) => Number(s.course) === Number(courseFilter));
  }

  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const slice = all.slice(start, start + limit);

  const data = slice.map((s) => ({ ...s, image: formatImageUrl(request, s.image) }));

  return reply.send({
    data,
    meta: { total, page, limit, totalPages },
  });
};

// GET /api/v1/students/:id
const getStudentById = async (request, reply) => {
  const { id } = request.params;
  const student = await studentsRepo.findById(id);
  if (!student) return reply.notFound('Student not found');
  return reply.send({ ...student, image: formatImageUrl(request, student.image) });
};

// GET /api/v2/students/:id  — з деталями курсу із зовнішнього API
const getStudentByIdWithDetails = async (request, reply) => {
  const { id } = request.params;
  const student = await studentsRepo.findById(id);
  if (!student) return reply.notFound('Student not found');

  const courseDetails = student.course
    ? await findCourseById(student.course)
    : null;

  return reply.send({
    ...student,
    image: formatImageUrl(request, student.image),
    courseDetails, // null, якщо зовнішнє API недоступне (graceful degradation)
  });
};

// GET /api/v1/students/export
const getStudentsExport = async (request, reply) => {
  const students = await studentsRepo.findAll();

  const csv = stringify(students, {
    header: true,
    columns: ['id', 'name', 'course', 'grades', 'email', 'image'],
  });

  reply.header('Content-Type', 'text/csv');
  reply.header('Content-Disposition', 'attachment; filename="students.csv"');
  return reply.send(csv);
};

// POST /api/v*/students
const createStudent = async (request, reply) => {
  const newStudent = await studentsRepo.create(request.body);
  return reply.code(201).send({ ...newStudent, image: formatImageUrl(request, newStudent.image) });
};

// PATCH /api/v*/students/:id
const updateStudent = async (request, reply) => {
  const { id } = request.params;
  const updated = await studentsRepo.update(id, request.body);
  if (!updated) return reply.notFound('Student not found');
  return reply.send({ ...updated, image: formatImageUrl(request, updated.image) });
};

// DELETE /api/v*/students/:id
const deleteStudent = async (request, reply) => {
  const { id } = request.params;
  const removed = await studentsRepo.remove(id);
  if (!removed) return reply.notFound('Student not found');
  return reply.send({ message: 'Student removed' });
};

// POST /api/v1/students/import
const importStudents = async (request, reply) => {
  const file = await request.file();
  if (!file) return reply.badRequest('Файл не завантажено');

  const buffer = await file.toBuffer();
  const content = buffer.toString('utf-8');
  const filename = file.filename.toLowerCase();

  let records = [];

  try {
    if (filename.endsWith('.json')) {
      records = JSON.parse(content);
      if (!Array.isArray(records)) return reply.badRequest('JSON має бути масивом');
    } else if (filename.endsWith('.csv')) {
      records = parse(content, { columns: true, skip_empty_lines: true });
    } else {
      return reply.badRequest('Підтримуються тільки CSV та JSON файли');
    }
  } catch {
    return reply.badRequest('Не вдалося розпарсити файл');
  }

  let imported = 0;
  const rejected = [];

  for (let i = 0; i < records.length; i++) {
    const record = { ...records[i] };

    if (filename.endsWith('.csv')) {
      if (record.course) record.course = Number(record.course);
      if (record.grades) record.grades = String(record.grades).split(',').map(Number);
    }

    const valid = validateStudent(record);
    if (!valid) {
      rejected.push({
        index: i + 1,
        reason: validateStudent.errors.map((e) => e.message).join(', '),
      });
      continue;
    }

    await studentsRepo.create(record);
    imported++;
  }

  return reply.send({ imported, rejected });
};

// POST /api/v*/students/:id/image
const uploadStudentImage = async (request, reply) => {
  const { id } = request.params;

  const student = await studentsRepo.findById(id);
  if (!student) return reply.notFound('Student not found');

  const file = await request.file({ limits: { fileSize: MAX_SIZE } });
  if (!file) return reply.badRequest('Файл не завантажено');

  const filename_lower = file.filename.toLowerCase();
  const isValidMime = ALLOWED_MIME.includes(file.mimetype);
  const isValidExt =
    filename_lower.endsWith('.jpg') ||
    filename_lower.endsWith('.jpeg') ||
    filename_lower.endsWith('.png');

  if (!isValidMime && !isValidExt) {
    return reply.badRequest('Дозволені тільки image/jpeg та image/png');
  }

  const uploadDir = path.join(process.cwd(), 'uploads', String(id));
  await fs.mkdir(uploadDir, { recursive: true });

  const ext =
    file.mimetype === 'image/png' || filename_lower.endsWith('.png') ? 'png' : 'jpg';
  const fileName = `image.${ext}`;
  const filePath = path.join(uploadDir, fileName);

  await pipeline(file.file, createWriteStream(filePath));

  const relativePath = `/${id}/${fileName}`;
  const updated = await studentsRepo.update(id, { image: relativePath });

  return reply.send({ ...updated, image: formatImageUrl(request, relativePath) });
};

export {
  getStudents,
  getStudentsPaginated,
  getStudentById,
  getStudentByIdWithDetails,
  getStudentsExport,
  createStudent,
  updateStudent,
  deleteStudent,
  importStudents,
  uploadStudentImage,
};
