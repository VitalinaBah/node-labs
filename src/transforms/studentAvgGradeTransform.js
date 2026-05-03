import { Transform } from 'node:stream';

/**
 * Variant 4 (Students): замінює масив grades на avgGrade (середній бал).
 * Працює в objectMode — кожен chunk це JS-об'єкт студента.
 */
export class StudentAvgGradeTransform extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(student, _encoding, callback) {
    try {
      const grades = Array.isArray(student.grades) ? student.grades : [];
      const avgGrade = grades.length
        ? Number(
            (grades.reduce((sum, g) => sum + Number(g), 0) / grades.length).toFixed(2),
          )
        : 0;

      // eslint-disable-next-line no-unused-vars
      const { grades: _omit, ...rest } = student;
      callback(null, { ...rest, avgGrade });
    } catch (err) {
      callback(err);
    }
  }
}
