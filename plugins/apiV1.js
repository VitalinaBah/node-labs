import healthRoutes from '#routes/v1/health.js';
import studentRoutes from '#routes/v1/students.js';
import githubRoutes from '#routes/v1/github.js';
import backupRoutes from '#routes/v1/backups.js';

const apiV1Plugin = async (fastify) => {
  await fastify.register(healthRoutes, { prefix: '/health' });
  await fastify.register(studentRoutes, { prefix: '/students' });
  await fastify.register(githubRoutes, { prefix: '/github' });
  await fastify.register(backupRoutes, { prefix: '/backups' });
};

export default apiV1Plugin;
