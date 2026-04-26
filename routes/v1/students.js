import {
  getStudents,
  getStudentById,
  getStudentByIdWithDetails,
  getStudentsExport,
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
        summary: 'Експорт студентів у CSV',
        produces: ['text/csv'],
      },
    },
    getStudentsExport,
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

  // Новий ендпоінт за вимогою завдання: запис + дані з зовнішнього API
  fastify.get(
    '/:id/details',
    {
      schema: {
        tags: [TAG],
        summary:
          'Студент + дані курсу з json-server (fetch + retry + cache + graceful)',
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
