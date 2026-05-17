import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/**',
        'services/**',
        'repositories/**',
        'controllers/**',
        'utils/**',
        'plugins/**',
        'routes/**',
        'db/**',
        'schemas/**',
        'constants/**',
      ],
      exclude: [
        'server.js',
        'src/app.js',
        'src/scripts/**',
        'src/migrations/**',
        'src/models/**',
        'tests/**',
        'node_modules/**',
        'coverage/**',
        'drizzle/**',
        '**/*.config.js',
        // Legacy файли з попередніх лабораторних що замінені новими і не реєструються
        'routes/health.js',
        'routes/students.js',
        'controllers/uploadStudentImage.js',
        'controllers/healthController.js',
        'constants/httpStatus.js',
        'constants/signals.js',
        'schemas/healthSchemas.js',
        // GitHub-інтеграція потребує реального GITHUB_TOKEN — не тестується автоматично
        'services/githubRestService.js',
        'services/githubGraphqlService.js',
        'controllers/githubController.js',
        'routes/v1/github.js',
        'routes/v2/github.js',
        // WebSocket-плагін — складно тестувати через inject (не HTTP)
        'plugins/realtime.js',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
