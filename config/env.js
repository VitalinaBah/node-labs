import validate from '#validators/envSchema.js';

if (!validate(process.env)) {
  console.error('Критична помилка: некоректні змінні середовища:');
  console.error(validate.errors.map((e) => e.message).join(', '));
  process.exit(1);
}

export default {
  PORT: parseInt(process.env.PORT),
  HOSTNAME: process.env.HOSTNAME || 'localhost',
  NODE_ENV: process.env.NODE_ENV,
};