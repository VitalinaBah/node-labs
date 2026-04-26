import studentRoutesV2 from '#routes/v2/students.js';
import githubV2Routes from '#routes/v2/github.js';

const apiV2Plugin = async (fastify) => {
  await fastify.register(studentRoutesV2, { prefix: '/students' });
  await fastify.register(githubV2Routes, { prefix: '/github' });
};

export default apiV2Plugin;
