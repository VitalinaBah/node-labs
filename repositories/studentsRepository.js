let STUDENTS = [{ id: 1, name: 'Ivan', grades: [5, 4, 5], course: 2 }];

export const findAll = () => [...STUDENTS];

export const findByCourse = (course) =>
  STUDENTS.filter((s) => s.course === Number(course));

export const findById = (id) =>
  STUDENTS.find((s) => s.id === Number(id));

export const create = (data) => {
  const newStudent = {
    id: STUDENTS.length + 1,
    name: data.name,
    grades: data.grades || [],
    course: data.course,
  };
  STUDENTS.push(newStudent);
  return newStudent;
};

export const update = (id, updates) => {
  const student = findById(id);
  if (!student) return null;
  delete updates.id;
  Object.assign(student, updates);
  return student;
};

export const remove = (id) => {
  const originalLength = STUDENTS.length;
  STUDENTS = STUDENTS.filter((s) => s.id !== Number(id));
  return STUDENTS.length !== originalLength;
};