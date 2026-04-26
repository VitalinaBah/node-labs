export const paginationQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
    course: { type: 'integer', minimum: 1, maximum: 6 },
  },
  additionalProperties: false,
};

export const paginatedStudentsResponseSchema = {
  type: 'object',
  properties: {
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          grades: { type: 'array', items: { type: 'number' } },
          course: { type: ['integer', 'string'] },
          email: { type: 'string' },
          image: { type: ['string', 'null'] },
        },
        additionalProperties: true,
      },
    },
    meta: {
      type: 'object',
      properties: {
        total: { type: 'integer' },
        page: { type: 'integer' },
        limit: { type: 'integer' },
        totalPages: { type: 'integer' },
      },
    },
  },
};
