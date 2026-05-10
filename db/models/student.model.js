import mongoose from 'mongoose';

/**
 * Variant 4 — Students.
 * Модель синхронізована з API-схемою studentBodySchema.
 */
const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 1 },
    grades: {
      type: [Number],
      default: [],
      validate: {
        validator: (arr) => arr.every((g) => g >= 1 && g <= 5),
        message: 'grades must be in [1..5]',
      },
    },
    course: { type: Number, required: true, min: 1, max: 6 },
    email: { type: String, default: null },
    image: { type: String, default: null },
  },
  {
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        return ret;
      },
    },
  },
);

export const Student = mongoose.model('Student', studentSchema);
