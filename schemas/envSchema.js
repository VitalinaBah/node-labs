export const envSchema = {
  type: 'object',
  properties: {
    PORT: {
      type: 'string',
      pattern: '^[0-9]+$',
      default: '3000',
    },
    HOSTNAME: {
      type: 'string',
      minLength: 1,
      default: 'localhost',
    },
    NODE_ENV: {
      type: 'string',
      enum: ['development', 'production'],
      default: 'development',
    },
    ADMIN_API_KEY: {
      type: 'string',
      minLength: 8,
    },
    ALLOWED_ORIGIN: {
      type: 'string',
      default: 'http://localhost:3000',
    },
  },
  required: ['PORT', 'NODE_ENV', 'ADMIN_API_KEY'],
  additionalProperties: true,
};