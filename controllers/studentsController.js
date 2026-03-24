let STUDENTS = [{ id: 1, name: 'Ivan', grades: [5, 4, 5], course: 2 }];

// GET /students?course=2
const getStudents = async (request, reply) => {
  const { course } = request.query;

  let result = [...STUDENTS];
  if (course) {
    result = result.filter((s) => s.course === Number(course));
  }

  return reply.send(result);
};

// POST /students
const createStudent = async (request, reply) => {
  const data = request.body;

  const newStudent = {
    id: STUDENTS.length + 1,
    name: data.name,
    grades: data.grades || [],
    course: data.course,
  };
  STUDENTS.push(newStudent);

  return reply.code(201).send(newStudent);
};

// PATCH /students/:id
const updateStudent = async (request, reply) => {
  const { id } = request.params;
  const updates = request.body;

  const student = STUDENTS.find((s) => s.id === Number(id));
  if (!student) {
    return reply.notFound('Student not found');
  }

  delete updates.id;
  Object.assign(student, updates);

  return reply.send(student);
};

// DELETE /students/:id
const deleteStudent = async (request, reply) => {
  const { id } = request.params;
  const originalLength = STUDENTS.length;
  STUDENTS = STUDENTS.filter((s) => s.id !== Number(id));

  if (STUDENTS.length === originalLength) {
    return reply.notFound('Student not found');
  }

  return reply.send({ message: 'Student removed' });
};

export { getStudents, createStudent, updateStudent, deleteStudent };