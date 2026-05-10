import { Student } from '../db/models/student.model.js';

/**
 * Фабрика репозиторію студентів. Отримує Mongoose-модель через DI:
 *   const studentsRepo = createStudentsRepository(fastify.mongoose);
 *
 * Зберігає той самий публічний API, що й файловий репозиторій з попередніх лабораторних,
 * щоб контролери залишилися без змін поведінкою.
 */
export const createStudentsRepository = (/* mongoose */) => {
  const toPlain = (doc) => {
    if (!doc) return null;
    const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
    return { id: String(obj._id ?? obj.id), ...obj, _id: undefined };
  };

  const findAll = async () => {
    const docs = await Student.find({}).lean();
    return docs.map(toPlain);
  };

  const findByCourse = async (course) => {
    const docs = await Student.find({ course: Number(course) }).lean();
    return docs.map(toPlain);
  };

  const findById = async (id) => {
    try {
      const doc = await Student.findById(id).lean();
      return toPlain(doc);
    } catch {
      return null;
    }
  };

  /**
   * Поступова пагінація. Mongo вміє це нативно через .skip().limit() — і ми не
   * витягуємо у пам'ять увесь набір, лише сторінку. countDocuments окремим запитом.
   */
  const findPage = async ({ page = 1, limit = 10, course } = {}) => {
    const filter = course !== undefined ? { course: Number(course) } : {};
    const total = await Student.countDocuments(filter);
    const docs = await Student.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    return { data: docs.map(toPlain), total };
  };

  const create = async (data) => {
    const doc = await Student.create(data);
    return toPlain(doc.toObject());
  };

  const update = async (id, updates) => {
    try {
      const doc = await Student.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true },
      ).lean();
      return toPlain(doc);
    } catch {
      return null;
    }
  };

  const remove = async (id) => {
    try {
      const res = await Student.findByIdAndDelete(id).lean();
      return Boolean(res);
    } catch {
      return false;
    }
  };

  /** Cursor для NDJSON / CSV stream — Mongoose віддає Readable у objectMode. */
  const cursor = (filter = {}) => Student.find(filter).lean().cursor();

  return { findAll, findByCourse, findById, findPage, create, update, remove, cursor };
};
