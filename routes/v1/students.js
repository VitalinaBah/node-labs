import {
  getStudents, getStudentById, getStudentByIdWithDetails,
  getStudentsExport, getStudentsStream,
  createStudent, updateStudent, deleteStudent,
  importStudents, uploadStudentImage,
} from '#controllers/studentsController.js';
import {
  studentQuerySchema, studentBodySchema, studentPatchSchema, studentParamSchema,
} from '#schemas/studentSchema.js';

const TAG = 'items v1';

const studentRoutesV1 = async (fastify) => {
  // ---------------- ПУБЛІЧНІ (GET) ----------------

  fastify.get('/', {
    schema: { tags: [TAG], summary: 'Список', querystring: studentQuerySchema },
  }, getStudents);

  fastify.get('/export', {
    schema: { tags: [TAG], summary: 'Експорт CSV (?transform=true → avgGrade)',
      produces: ['text/csv'],
      querystring: { type: 'object', properties: { transform: { type: 'string', enum: ['true','false'] }}, additionalProperties: false }},
  }, getStudentsExport);

  fastify.get('/stream', {
    schema: { tags: [TAG], summary: 'NDJSON-стрім', produces: ['application/x-ndjson'] },
  }, getStudentsStream);

  fastify.get('/:id', {
    schema: { tags: [TAG], summary: 'За id', params: studentParamSchema },
  }, getStudentById);

  fastify.get('/:id/details', {
    schema: { tags: [TAG], summary: 'За id + courseDetails (Redis-кеш зовнішнього API)',
      params: studentParamSchema },
  }, getStudentByIdWithDetails);

  // ---------------- ЗАХИЩЕНІ (POST/PATCH/DELETE) ----------------

  fastify.post('/', {
    onRequest: [fastify.authenticate],
    schema: { tags: [TAG], summary: 'Створити (auth)', body: studentBodySchema,
      security: [{ cookieAuth: [] }] },
  }, createStudent);

  fastify.post('/import', {
    onRequest: [fastify.authenticate],
    schema: { tags: [TAG], summary: 'Імпорт (auth)', consumes: ['multipart/form-data'],
      security: [{ cookieAuth: [] }] },
  }, importStudents);

  fastify.patch('/:id', {
    onRequest: [fastify.authenticate],
    schema: { tags: [TAG], summary: 'Оновити (auth)', params: studentParamSchema,
      body: studentPatchSchema, security: [{ cookieAuth: [] }] },
  }, updateStudent);

  fastify.delete('/:id', {
    onRequest: [fastify.authenticate],
    schema: { tags: [TAG], summary: 'Видалити (auth)', params: studentParamSchema,
      security: [{ cookieAuth: [] }] },
  }, deleteStudent);

  fastify.post('/:id/image', {
    onRequest: [fastify.authenticate],
    schema: { tags: [TAG], summary: 'Фото (auth)', params: studentParamSchema,
      consumes: ['multipart/form-data'], security: [{ cookieAuth: [] }] },
  }, uploadStudentImage);
};

export default studentRoutesV1;
