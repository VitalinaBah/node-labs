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
  // ПУБЛІЧНІ
  fastify.get('/', {
    schema: { tags: [TAG], summary: 'Список', querystring: studentQuerySchema },
  }, getStudents);

  fastify.get('/export', {
    schema: { tags: [TAG], summary: 'Експорт CSV', produces: ['text/csv'],
      querystring: { type: 'object', properties: { transform: { type: 'string', enum: ['true','false'] }}, additionalProperties: false }},
  }, getStudentsExport);

  fastify.get('/stream', {
    schema: { tags: [TAG], summary: 'NDJSON-стрім', produces: ['application/x-ndjson'] },
  }, getStudentsStream);

  fastify.get('/:id', { schema: { tags: [TAG], summary: 'За id', params: studentParamSchema }}, getStudentById);
  fastify.get('/:id/details', { schema: { tags: [TAG], summary: 'За id + courseDetails', params: studentParamSchema }}, getStudentByIdWithDetails);

  // ЗАХИЩЕНІ — Bearer JWT
  fastify.post('/', {
    onRequest: [fastify.authenticate],
    schema: { tags: [TAG], summary: 'Створити (Bearer)', body: studentBodySchema, security: [{ bearerAuth: [] }] },
  }, createStudent);

  fastify.post('/import', {
    onRequest: [fastify.authenticate],
    schema: { tags: [TAG], summary: 'Імпорт (Bearer)', consumes: ['multipart/form-data'], security: [{ bearerAuth: [] }] },
  }, importStudents);

  fastify.patch('/:id', {
    onRequest: [fastify.authenticate],
    schema: { tags: [TAG], summary: 'Оновити (Bearer)', params: studentParamSchema, body: studentPatchSchema, security: [{ bearerAuth: [] }] },
  }, updateStudent);

  fastify.delete('/:id', {
    onRequest: [fastify.authenticate],
    schema: { tags: [TAG], summary: 'Видалити (Bearer)', params: studentParamSchema, security: [{ bearerAuth: [] }] },
  }, deleteStudent);

  fastify.post('/:id/image', {
    onRequest: [fastify.authenticate],
    schema: { tags: [TAG], summary: 'Фото (Bearer)', params: studentParamSchema, consumes: ['multipart/form-data'], security: [{ bearerAuth: [] }] },
  }, uploadStudentImage);
};

export default studentRoutesV1;
