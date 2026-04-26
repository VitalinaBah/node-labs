export const sharedReposQuerySchema = {
  type: 'object',
  required: ['repo'],
  properties: {
    repo: {
      type: 'string',
      pattern: '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$',
      description: 'GitHub-репозиторій у форматі owner/name',
    },
  },
  additionalProperties: false,
};

export const sharedReposResponseSchema = {
  type: 'object',
  properties: {
    source: { type: 'string', enum: ['rest', 'graphql', 'graphql-fallback-rest'] },
    repo: { type: 'string' },
    top: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          full_name: { type: 'string' },
          sharedContributors: { type: 'integer' },
        },
      },
    },
  },
};
