import ENV from '#constants/environments.js';

export const envSchema = {
  type: 'object',
  properties: {
    PORT: { type: 'string', pattern: '^[0-9]+$', default: '3000' },
    HOSTNAME: { type: 'string', minLength: 1, default: 'localhost' },
    NODE_ENV: {
      type: 'string',
      enum: [ENV.DEVELOPMENT, ENV.PRODUCTION],
      default: ENV.DEVELOPMENT,
    },
    ADMIN_API_KEY: { type: 'string', minLength: 8 },
    ALLOWED_ORIGIN: { type: 'string', default: 'http://localhost:3000' },
    EXTERNAL_API_URL: { type: 'string', default: 'http://localhost:3001' },
    GITHUB_TOKEN: { type: 'string', default: '' },
    // Lab 8 — MongoDB
    MONGO_URL: { type: 'string', default: 'mongodb://localhost:27017' },
    MONGO_DB_NAME: { type: 'string', default: 'lab8_students' },
  },
  required: ['PORT', 'NODE_ENV', 'ADMIN_API_KEY', 'MONGO_URL', 'MONGO_DB_NAME'],
  additionalProperties: true,
};
