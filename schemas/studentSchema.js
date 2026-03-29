// GET /students?course=2
export const studentQuerySchema = {
  type: 'object',
  properties: {
    course: { type: 'string', pattern: '^[0-9]+$' },
  },
  additionalProperties: true,
};

// POST /students body
export const studentBodySchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    grades: {
      type: 'array',
      items: { type: 'number', minimum: 1, maximum: 5 },
    },
    course: { type: 'integer', minimum: 1, maximum: 6 },
  },
  required: ['name', 'course'],
  additionalProperties: false,
};

// PATCH /students body
export const studentPatchSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    grades: {
      type: 'array',
      items: { type: 'number', minimum: 1, maximum: 5 },
    },
    course: { type: 'integer', minimum: 1, maximum: 6 },
  },
  minProperties: 1,
  additionalProperties: false,
};

// :id param
export const studentParamSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', pattern: '^[0-9]+$' },
  },
  required: ['id'],
};