import {
  getStudents,
  getStudentById,
  getStudentByIdWithDetails,
  getStudentsExport,
  getStudentsStream,
  createStudent,
  updateStudent,
  deleteStudent,
  importStudents,
  uploadStudentImage,
} from '#controllers/studentsController.js';
import {
  studentQuerySchema,
  studentBodySchema,
  studentPatchSchema,
  studentParamSchema,
} from '#schemas/studentSchema.js';

const TAG = 'items v1';

const studentRoutesV1 = async (fastify) => {
  fastify.get(
    '/',
    {
      schema: {
        tags: [TAG],
        summary: 'Список студентів (без пагінації, з фільтром course)',
        querystring: studentQuerySchema,
      },
    },
    getStudents,
  );

  fastify.get(
    '/export',
    {
      schema: {
        tags: [TAG],
        summary:
          'Потоковий експорт студентів у CSV (?transform=true → grades→avgGrade)',
        produces: ['text/csv'],
        querystring: {
          type: 'object',
          properties: { transform: { type: 'string', enum: ['true', 'false'] } },
          additionalProperties: false,
        },
      },
    },
    getStudentsExport,
  );

  // Lab 7: NDJSON стрім
  fastify.get(
    '/stream',
    {
      schema: {
        tags: [TAG],
        summary: 'Потокова віддача студентів у NDJSON (по 1 запису)',
        produces: ['application/x-ndjson'],
      },
    },
    getStudentsStream,
  );

  fastify.post(
    '/',
    {
      schema: {
        tags: [TAG],
        summary: 'Створити студента',
        body: studentBodySchema,
      },
    },
    createStudent,
  );

  fastify.post(
    '/import',
    {
      schema: {
        tags: [TAG],
        summary: 'Імпорт студентів із CSV/JSON',
        consumes: ['multipart/form-data'],
      },
    },
    importStudents,
  );

  fastify.get(
    '/:id',
    {
      schema: {
        tags: [TAG],
        summary: 'Отримати студента за id',
        params: studentParamSchema,
      },
    },
    getStudentById,
  );

  // Lab 6: запис + дані з зовнішнього API
  fastify.get(
    '/:id/details',
    {
      schema: {
        tags: [TAG],
        summary: 'Студент + дані курсу з json-server (fetch + retry + cache + graceful)',
        params: studentParamSchema,
      },
    },
    getStudentByIdWithDetails,
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        tags: [TAG],
        summary: 'Оновити студента',
        params: studentParamSchema,
        body: studentPatchSchema,
      },
    },
    updateStudent,
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        tags: [TAG],
        summary: 'Видалити студента',
        params: studentParamSchema,
      },
    },
    deleteStudent,
  );

  fastify.post(
    '/:id/image',
    {
      schema: {
        tags: [TAG],
        summary: 'Завантажити фото студента',
        params: studentParamSchema,
        consumes: ['multipart/form-data'],
      },
    },
    uploadStudentImage,
  );
};

export default studentRoutesV1;
