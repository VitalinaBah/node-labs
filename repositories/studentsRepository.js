import { Readable } from 'node:stream';

/**
 * Фабрика репозиторію над mysql2 pool. DI: createStudentsRepository(fastify.mysql).
 * Не імпортує екземпляр Fastify напряму — отримує pool через параметр.
 */
export const createStudentsRepository = (pool) => {
  // mysql2 повертає JSON колонку як рядок — парсимо вручну
  const fromRow = (row) => {
    if (!row) return null;
    let grades = row.grades;
    if (typeof grades === 'string') {
      try { grades = JSON.parse(grades); } catch { grades = []; }
    }
    return {
      id: row.id,
      name: row.name,
      grades: grades ?? [],
      course: row.course,
      email: row.email,
      image: row.image,
    };
  };

  const findAll = async () => {
    const [rows] = await pool.execute('SELECT * FROM students ORDER BY id');
    return rows.map(fromRow);
  };

  const findByCourse = async (course) => {
    const [rows] = await pool.execute(
      'SELECT * FROM students WHERE course = ? ORDER BY id',
      [Number(course)],
    );
    return rows.map(fromRow);
  };

  const findById = async (id) => {
    const [rows] = await pool.execute('SELECT * FROM students WHERE id = ?', [Number(id)]);
    return rows.length ? fromRow(rows[0]) : null;
  };

  /** Поступова пагінація через SQL LIMIT/OFFSET. */
  const findPage = async ({ page = 1, limit = 10, course } = {}) => {
    const params = [];
    let where = '';
    if (course !== undefined) {
      where = 'WHERE course = ?';
      params.push(Number(course));
    }
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM students ${where}`,
      params,
    );
    const total = Number(countRows[0].total);

    const offset = (page - 1) * limit;
    const [rows] = await pool.execute(
      `SELECT * FROM students ${where} ORDER BY id LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)],
    );
    return { data: rows.map(fromRow), total };
  };

  const create = async (data) => {
    const [result] = await pool.execute(
      'INSERT INTO students (name, grades, course, email, image) VALUES (?, ?, ?, ?, ?)',
      [
        data.name,
        JSON.stringify(data.grades ?? []),
        Number(data.course),
        data.email ?? null,
        data.image ?? null,
      ],
    );
    return findById(result.insertId);
  };

  const update = async (id, updates) => {
    const existing = await findById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    await pool.execute(
      'UPDATE students SET name = ?, grades = ?, course = ?, email = ?, image = ? WHERE id = ?',
      [
        merged.name,
        JSON.stringify(merged.grades ?? []),
        Number(merged.course),
        merged.email ?? null,
        merged.image ?? null,
        Number(id),
      ],
    );
    return findById(id);
  };

  const remove = async (id) => {
    const [result] = await pool.execute('DELETE FROM students WHERE id = ?', [Number(id)]);
    return result.affectedRows > 0;
  };

  /**
   * Курсор для NDJSON / CSV. Використовуємо нативний mysql2 stream
   * через pool.query(...).stream() — без буферизації всіх рядків.
   */
  const cursor = () => {
    const queryStream = pool.pool.query('SELECT * FROM students ORDER BY id').stream();
    // Оборачиваємо у objectMode Readable з парсингом grades
    return Readable.from((async function* () {
      for await (const row of queryStream) {
        yield fromRow(row);
      }
    })(), { objectMode: true });
  };

  return { findAll, findByCourse, findById, findPage, create, update, remove, cursor };
};
