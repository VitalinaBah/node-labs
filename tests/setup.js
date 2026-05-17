import { config } from 'dotenv';
import { resolve } from 'node:path';

// Завантажуємо тестові змінні до того, як буде імпортовано буд-який модуль додатка.
config({ path: resolve(process.cwd(), '.env.test') });

process.env.NODE_ENV = 'test';
