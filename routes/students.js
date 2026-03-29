import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from '#controllers/studentsController.js';
import {
  studentQuerySchema,
  studentBodySchema,
  studentPatchSchema,
  studentParamSchema,
} from '#schemas/studentSchema.js';

const studentRoutes = async (fastify) => {
  fastify.get('/', {
    schema: { querystring: studentQuerySchema },
  }, getStudents);

  fastify.post('/', {
    schema: { body: studentBodySchema },
  }, createStudent);

  fastify.patch('/:id', {
    schema: {
      params: studentParamSchema,
      body: studentPatchSchema,
    },
  }, updateStudent);

  fastify.delete('/:id', {
    schema: { params: studentParamSchema },
  }, deleteStudent);
};

export default studentRoutes;