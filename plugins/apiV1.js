import healthRoutes from '#routes/v1/health.js';
import studentRoutes from '#routes/v1/students.js';
import githubRoutes from '#routes/v1/github.js';

const apiV1Plugin = async (fastify) => {
  await fastify.register(healthRoutes, { prefix: '/health' });
  await fastify.register(studentRoutes, { prefix: '/students' });
  await fastify.register(githubRoutes, { prefix: '/github' });
};

export default apiV1Plugin;
