import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentsExport,
  importStudents,
  uploadStudentImage,
} from '#controllers/studentsController.js';
import {
  studentQuerySchema,
  studentBodySchema,
  studentPatchSchema,
  studentParamSchema,
} from '#schemas/studentSchema.js';

const studentRoutes = async (fastify) => {
  fastify.get('/', { schema: { querystring: studentQuerySchema } }, getStudents);
  fastify.get('/export', getStudentsExport);

  fastify.post('/', { schema: { body: studentBodySchema } }, createStudent);
  fastify.post('/import', importStudents);

  fastify.get('/:id', { schema: { params: studentParamSchema } }, getStudentById);

  fastify.patch('/:id', {
    schema: { params: studentParamSchema, body: studentPatchSchema },
  }, updateStudent);

  fastify.delete('/:id', { schema: { params: studentParamSchema } }, deleteStudent);

  fastify.post('/:id/image', { schema: { params: studentParamSchema } }, uploadStudentImage);
};

export default studentRoutes;