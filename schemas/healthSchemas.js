export const healthSchema = {
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          status: { type: 'string' },
        },
        required: ['status'],
      },
    },
  },
};

export const healthDetailsSchema = {
  schema: {
    headers: {
      type: 'object',
      properties: {
        'x-api-key': { type: 'string' },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          pid: { type: 'number' },
          nodeVersion: { type: 'string' },
          platform: { type: 'string' },
          uptime: { type: 'string' },
          memoryUsage: {
            type: 'object',
            properties: {
              rss: { type: 'number' },
              heapTotal: { type: 'number' },
              heapUsed: { type: 'number' },
              external: { type: 'number' },
            },
          },
        },
        required: ['pid', 'nodeVersion', 'platform', 'uptime'],
      },
    },
  },
};