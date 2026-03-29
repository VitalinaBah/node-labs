import * as studentsRepo from '#repositories/studentsRepository.js';

const getStudents = async (request, reply) => {
  const { course } = request.query;
  const result = course
    ? studentsRepo.findByCourse(course)
    : studentsRepo.findAll();
  return reply.send(result);
};

const createStudent = async (request, reply) => {
  const newStudent = studentsRepo.create(request.body);
  return reply.code(201).send(newStudent);
};

const updateStudent = async (request, reply) => {
  const { id } = request.params;
  const updated = studentsRepo.update(id, request.body);
  if (!updated) return reply.notFound('Student not found');
  return reply.send(updated);
};

const deleteStudent = async (request, reply) => {
  const { id } = request.params;
  const removed = studentsRepo.remove(id);
  if (!removed) return reply.notFound('Student not found');
  return reply.send({ message: 'Student removed' });
};

export { getStudents, createStudent, updateStudent, deleteStudent };