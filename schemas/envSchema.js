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
    // MySQL (з Lab 8)
    MYSQL_HOST: { type: 'string', default: 'localhost' },
    MYSQL_PORT: { type: 'string', pattern: '^[0-9]+$', default: '3307' },
    MYSQL_USER: { type: 'string', default: 'root' },
    MYSQL_PASSWORD: { type: 'string', default: '' },
    MYSQL_DB: { type: 'string', default: 'lab8_students' },
    // Lab 9 — Redis
    REDIS_HOST: { type: 'string', default: 'localhost' },
    REDIS_PORT: { type: 'string', pattern: '^[0-9]+$', default: '6379' },
  },
  required: [
    'PORT', 'NODE_ENV', 'ADMIN_API_KEY',
    'MYSQL_HOST', 'MYSQL_PORT', 'MYSQL_USER', 'MYSQL_DB',
    'REDIS_HOST', 'REDIS_PORT',
  ],
  additionalProperties: true,
};
